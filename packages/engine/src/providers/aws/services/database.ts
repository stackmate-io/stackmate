import pipe from '@bitty/pipe';
import { dbInstance as rdsDbInstance, dbParameterGroup } from '@cdktf/provider-aws';

import { Stack } from '@stackmate/engine/core/stack';
import { getServiceProfile } from '@stackmate/engine/core/profile';
import { ChoiceOf, OneOfType } from '@stackmate/engine/lib';
import { DEFAULT_PORT, DEFAULT_PROFILE_NAME, PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import { AwsServiceAssociations, getAwsCloudService } from '@stackmate/engine/providers/aws/service';
import {
  RootCredentialsRequirement, withCredentials, withRootCredentials,
} from '@stackmate/engine/core/service/credentials';
import {
  DEFAULT_RDS_INSTANCE_SIZE, RdsEngine, RDS_DEFAULT_VERSIONS_PER_ENGINE,
  RDS_INSTANCE_SIZES, RDS_LOG_EXPORTS_PER_ENGINE, RDS_MAJOR_VERSIONS_PER_ENGINE,
  RDS_PARAM_FAMILY_MAPPING, REGIONS,
} from '@stackmate/engine/providers/aws/constants';
import {
  BaseServiceAttributes, ConnectableAttributes, EngineAttributes, multiNode,
  MultiNodeAttributes, profilable, ProfilableAttributes, Provisionable,
  ProvisionAssociationRequirements, ProvisionHandler, RegionalAttributes, Service,
  ServiceTypeChoice, sizeable, SizeableAttributes, storable, StorableAttributes,
  versioned, VersioningAttributes, withDatabase, withEngine, withHandler, withConfigHints, connectable,
} from '@stackmate/engine/core/service';

type DatabaseAttributes = BaseServiceAttributes
  & RegionalAttributes<ChoiceOf<typeof REGIONS>>
  & SizeableAttributes
  & VersioningAttributes
  & MultiNodeAttributes
  & StorableAttributes
  & ConnectableAttributes
  & EngineAttributes<RdsEngine>
  & ProfilableAttributes & {
    provider: typeof PROVIDER.AWS,
    database: string;
  };

export type AwsDatabaseDeployableResources = {
  dbInstance: rdsDbInstance.DbInstance,
  paramGroup: dbParameterGroup.DbParameterGroup,
};

export type AwsDatabaseAttributes<
  T extends ServiceTypeChoice, E extends RdsEngine
> = DatabaseAttributes & EngineAttributes<E> & { type: T; };

export type AwsMySQLAttributes = AwsDatabaseAttributes<'mysql', 'mysql'>;
export type AwsPostgreSQLAttributes = AwsDatabaseAttributes<'postgresql', 'postgres'>;
export type AwsMariaDBAttributes = AwsDatabaseAttributes<'mariadb', 'mariadb'>;

type AwsDbService<Attrs extends DatabaseAttributes> = Service<Attrs> & {
  associations: [...AwsServiceAssociations, RootCredentialsRequirement],
};

export type AwsMySQLService = AwsDbService<AwsMySQLAttributes>;
export type AwsPostgreSQLService = AwsDbService<AwsPostgreSQLAttributes>;
export type AwsMariaDBService = AwsDbService<AwsMariaDBAttributes>;

type AwsDbAttributes = OneOfType<[
  AwsMySQLAttributes,
  AwsPostgreSQLAttributes,
  AwsMariaDBAttributes,
]>;
type AwsDb = OneOfType<[AwsMySQLService, AwsPostgreSQLService, AwsMariaDBService]>;
type AwsBaseProvisionable = Provisionable & {
  config: AwsDbAttributes;
  service: AwsDb;
};

export type AwsDatabaseDeployableProvisionable = AwsBaseProvisionable & {
  requirements: ProvisionAssociationRequirements<AwsDb['associations'], 'deployable'>;
  provisions: AwsDatabaseDeployableResources;
};

export type AwsDatabaseDestroyableProvisionable = AwsBaseProvisionable & {
  requirements: ProvisionAssociationRequirements<AwsDb['associations'], 'destroyable'>;
  provisions: AwsDatabaseDeployableResources;
};

export type AwsDatabasPreparableProvisionable = AwsBaseProvisionable & {
  requirements: ProvisionAssociationRequirements<AwsDb['associations'], 'preparable'>;
  provisions: AwsDatabaseDeployableResources;
};

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
export const onDeploy: ProvisionHandler = (
  provisionable: AwsDatabaseDeployableProvisionable, stack: Stack,
): AwsDatabaseDeployableResources => {
  const {
    config,
    service,
    requirements: { providerInstance, rootCredentials },
  } = provisionable;

  const { instance, params } = getServiceProfile(
    service.provider, service.type, config.profile || DEFAULT_PROFILE_NAME,
  );

  const paramGroup = new dbParameterGroup.DbParameterGroup(
    stack.context, `${provisionable.resourceId}-params`, {
      ...params, family: getParamGroupFamily(config)
    },
  );

  const dbInstance = new rdsDbInstance.DbInstance(stack.context, config.name, {
    ...instance,
    allocatedStorage: config.storage,
    count: config.nodes,
    enabledCloudwatchLogsExports: RDS_LOG_EXPORTS_PER_ENGINE[config.engine],
    engine: config.engine,
    engineVersion: config.version,
    identifier: provisionable.resourceId,
    instanceClass: config.size,
    name: config.database,
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

  return { dbInstance, paramGroup };
};

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
    withCredentials(),
    withConfigHints(hints),
    withRootCredentials(),
    withHandler('deployable', onDeploy),
  )(getAwsCloudService(type));

  return pipe(
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
