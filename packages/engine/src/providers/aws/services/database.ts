import pipe from '@bitty/pipe';
import { kebabCase } from 'lodash';
import { TerraformOutput } from 'cdktf';
import { dbInstance as rdsDbInstance, dbParameterGroup } from '@cdktf/provider-aws';

import { Stack } from '@stackmate/engine/core/stack';
import { getResourcesProfile } from '@stackmate/engine/core/profile';
import { ChoiceOf, OneOfType } from '@stackmate/engine/lib';
import { DatabaseServiceAttributes } from '@stackmate/engine/providers/types';
import { DEFAULT_PORT, PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import { RootCredentialsAssociations, withRootCredentials } from '@stackmate/engine/core/service/credentials';
import {
  AwsService, getAwsCloudService, onExternalLink, onServiceLinked,
} from '@stackmate/engine/providers/aws/service';
import {
  DEFAULT_RDS_INSTANCE_SIZE, RdsEngine, RDS_DEFAULT_VERSIONS_PER_ENGINE,
  RDS_INSTANCE_SIZES, RDS_LOG_EXPORTS_PER_ENGINE, RDS_MAJOR_VERSIONS_PER_ENGINE,
  RDS_PARAM_FAMILY_MAPPING, REGIONS,
} from '@stackmate/engine/providers/aws/constants';
import {
  EngineAttributes, multiNode, profilable, Provisionable, RegionalAttributes,
  ServiceTypeChoice, sizeable, storable, versioned, withDatabase,
  withEngine, withHandler, withConfigHints, connectable, linkable, externallyLinkable, monitored,
} from '@stackmate/engine/core/service';
import { withAwsAlarms } from '@stackmate/engine/providers/aws/service';
import { awsDatabaseAlarms } from '../alarms/database';

type DatabaseAttributes = DatabaseServiceAttributes
  & RegionalAttributes<ChoiceOf<typeof REGIONS>>
  & EngineAttributes<RdsEngine>
  & {
    provider: typeof PROVIDER.AWS,
  };

export type AwsDatabaseDeployableResources = {
  dbInstance: rdsDbInstance.DbInstance,
  paramGroup: dbParameterGroup.DbParameterGroup,
  outputs: TerraformOutput[],
};

export type AwsDatabaseAttributes<
  T extends ServiceTypeChoice, E extends RdsEngine
> = DatabaseAttributes & EngineAttributes<E> & { type: T; };

export type AwsMySQLAttributes = AwsDatabaseAttributes<'mysql', 'mysql'>;
export type AwsPostgreSQLAttributes = AwsDatabaseAttributes<'postgresql', 'postgres'>;
export type AwsMariaDBAttributes = AwsDatabaseAttributes<'mariadb', 'mariadb'>;

type AwsDbService<Attrs extends DatabaseAttributes> = AwsService<
  Attrs, RootCredentialsAssociations
>;

export type AwsMySQLService = AwsDbService<AwsMySQLAttributes>;
export type AwsPostgreSQLService = AwsDbService<AwsPostgreSQLAttributes>;
export type AwsMariaDBService = AwsDbService<AwsMariaDBAttributes>;


type AwsDb = OneOfType<[AwsMySQLService, AwsPostgreSQLService, AwsMariaDBService]>;

export type AwsDatabaseDestroyableProvisionable = Provisionable<AwsDb, {}, 'destroyable'>;
export type AwsDatabasPreparableProvisionable = Provisionable<AwsDb, {}, 'preparable'>;
export type AwsDatabaseDeployableProvisionable = Provisionable<
  AwsDb, AwsDatabaseDeployableResources, 'deployable'
>;

/**
 * @param {DatabaseAttributes} config the service's configuration
 * @returns {String} the parameter group family to use when provisioning the database
 */
export const getParamGroupFamily = (config: DatabaseAttributes): string => {
  const triad = RDS_PARAM_FAMILY_MAPPING.find(
    ([engine, version]) => engine === config.engine && config.version.startsWith(version),
  );

  if (!triad) {
    throw new Error(
      `We couldn’t determine the parameter group family for engine ${config.engine} version ${config.version}`,
    );
  }

  return triad[2];
}

/**
 * Provisions the database service
 *
 * @param {AwsDatabaseDeployableProvisionable} provisionable the service's configuration
 * @param {Stack} stack the stack to deploy
 * @returns {Provisions} the provisions generated
 */
const deployDatabases = (
  provisionable: AwsDatabaseDeployableProvisionable, stack: Stack,
): (() => AwsDatabaseDeployableResources) => (): AwsDatabaseDeployableResources => {
  const { config, requirements: { providerInstance, rootCredentials } } = provisionable;
  const { instance, params } = getResourcesProfile(config);

  const paramGroup = new dbParameterGroup.DbParameterGroup(
    stack.context, `${provisionable.resourceId}-params`, {
      ...params, family: getParamGroupFamily(config)
    },
  );

  const dbInstance = new rdsDbInstance.DbInstance(stack.context, config.name, {
    ...instance,
    allocatedStorage: config.storage,
    applyImmediately: true,
    count: config.nodes,
    enabledCloudwatchLogsExports: RDS_LOG_EXPORTS_PER_ENGINE[config.engine],
    engine: config.engine,
    engineVersion: config.version,
    identifier: kebabCase(`${config.name}-${stack.stageName}`),
    instanceClass: config.size,
    dbName: config.database,
    parameterGroupName: paramGroup.name,
    port: config.port,
    provider: providerInstance,
    dbSubnetGroupName: `db-subnet-${provisionable.resourceId}`,
    username: rootCredentials.username.expression,
    password: rootCredentials.password.expression,
    lifecycle: {
      createBeforeDestroy: true,
    },
  });

  const outputs: TerraformOutput[] = [
    new TerraformOutput(stack.context, `${config.name}-endpoint-output`, {
      description: `Connection endpoint for "${config.name}" RDS service`,
      value: dbInstance.endpoint,
    }),
  ];

  return { dbInstance, paramGroup, outputs };
};

/**
 * Provisions the database resources along with monitoring resources
 *
 * @param {AwsDatabaseDeployableProvisionable} provisionable the service's configuration
 * @param {Stack} stack the stack to deploy
 * @returns {Provisions} the provisions generated
*/
export const onDeploy = (
  provisionable: AwsDatabaseDeployableProvisionable, stack: Stack,
): AwsDatabaseDeployableResources => (
  pipe(
    deployDatabases(provisionable, stack),
    withAwsAlarms<AwsDatabaseDeployableProvisionable>(provisionable, stack, awsDatabaseAlarms),
  )()
);

/**
 * @param {ServiceTypeChoice} type the type of service to instantiate
 * @param {RdsEngine} engine the RDS engine to use
 * @returns {AwsDatabaseService<DatabaseAttributes>} the database service
 */
export const getDatabaseService = <T extends ServiceTypeChoice, E extends RdsEngine>(
  type: T, engine: E,
): AwsDbService<AwsDatabaseAttributes<T, E>> => {
  const defaultPort = DEFAULT_PORT.get(type);
  if (!defaultPort) {
    throw new Error(`There is no default port set for service ${type}`);
  }

  const hints = {
    name: {
      isIncludedInConfigGeneration: true,
      serviceConfigGenerationTemplate: '${type}-${stageName}-database',
    },
  };

  const base = pipe(
    withConfigHints(hints),
    withRootCredentials(),
    withHandler('deployable', onDeploy),
    linkable(onServiceLinked),
    externallyLinkable(onExternalLink),
  )(getAwsCloudService(type));

  return pipe(
    monitored(),
    sizeable(RDS_INSTANCE_SIZES, DEFAULT_RDS_INSTANCE_SIZE),
    versioned(RDS_MAJOR_VERSIONS_PER_ENGINE[engine], RDS_DEFAULT_VERSIONS_PER_ENGINE[engine]),
    connectable(defaultPort),
    storable(),
    withEngine(engine),
    multiNode(),
    profilable(),
    withDatabase(),
  )(base);
};

export const AWSMySQL: AwsMySQLService = getDatabaseService(SERVICE_TYPE.MYSQL, 'mysql');
export const AWSMariaDB: AwsMariaDBService = getDatabaseService(SERVICE_TYPE.MARIADB, 'mariadb');
export const AWSPostgreSQL: AwsPostgreSQLService = getDatabaseService(
  SERVICE_TYPE.POSTGRESQL, 'postgres',
);
