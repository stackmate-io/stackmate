import pipe from '@bitty/pipe';
import { DbInstance, DbParameterGroup } from '@cdktf/provider-aws/lib/rds';

import { Stack } from '@stackmate/engine/core/stack';
import { ChoiceOf, OneOfType } from '@stackmate/engine/lib';
import { DEFAULT_PROFILE_NAME, PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import { AwsServiceAssociations, getAwsCloudService } from '@stackmate/engine/providers/aws/services/core';
import {
  RootCredentialsAssociation, withCredentials, withRootCredentials,
} from '@stackmate/engine/core/service/credentials';
import {
  DEFAULT_RDS_INSTANCE_SIZE, RdsEngine, RDS_DEFAULT_VERSIONS_PER_ENGINE,
  RDS_INSTANCE_SIZES, RDS_LOG_EXPORTS_PER_ENGINE, RDS_MAJOR_VERSIONS_PER_ENGINE, RDS_PARAM_FAMILY_MAPPING, REGIONS,
} from '@stackmate/engine/providers/aws/constants';
import {
  CloudServiceAttributes, ConnectableAttributes, EngineAttributes, multiNode, MultiNodeAttributes, profilable,
  ProfilableAttributes, Provisionable, ProvisionAssociationRequirements, ProvisionHandler,
  RegionalAttributes, Service, ServiceTypeChoice, sizeable, SizeableAttributes, storable,
  StorableAttributes, versioned, VersioningAttributes, withDatabase,
  withEngine, withHandler,
} from '@stackmate/engine/core/service';
import { getServiceProfile } from '@stackmate/engine/core/profile';

type DatabaseAttributes = CloudServiceAttributes
  & EngineAttributes<RdsEngine>
  & RegionalAttributes<ChoiceOf<typeof REGIONS>>
  & SizeableAttributes
  & VersioningAttributes
  & MultiNodeAttributes
  & StorableAttributes
  & ConnectableAttributes
  & ProfilableAttributes & {
    provider: typeof PROVIDER.AWS,
    database: string;
  };

type AwsDatabaseDeployableResources = {
  paramGroup: DbParameterGroup,
  dbInstance: DbInstance,
};

type AwsDatabaseAttributes<
  T extends ServiceTypeChoice, E extends RdsEngine
> = DatabaseAttributes & EngineAttributes<E> & { type: T; };

export type AwsMySQLAttributes = AwsDatabaseAttributes<'mysql', 'mysql'>;
export type AwsPostgreSQLAttributes = AwsDatabaseAttributes<'postgresql', 'postgres'>;
export type AwsMariaDBAttributes = AwsDatabaseAttributes<'mariadb', 'mariadb'>;

type AwsDbService<Attrs extends DatabaseAttributes> = Service<Attrs> & {
  associations: [...AwsServiceAssociations, RootCredentialsAssociation],
};

export type AwsMySQLService = AwsDbService<AwsMySQLAttributes>;
export type AwsPostgreSQLService = AwsDbService<AwsPostgreSQLAttributes>;
export type AwsMariaDBService = AwsDbService<AwsMariaDBAttributes>;

type AwsDb = OneOfType<[AwsMySQLService, AwsPostgreSQLService, AwsMariaDBService]>;
type AwsDbAttributes = OneOfType<[AwsMySQLAttributes, AwsPostgreSQLAttributes, AwsMariaDBAttributes]>;
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

export const getParamGroupFamily = (config: DatabaseAttributes) => {
  const triad = RDS_PARAM_FAMILY_MAPPING.find(
    ([engine, version]) => engine === config.engine && config.version.startsWith(version),
  );

  if (!triad) {
    throw new Error(
      'We couldn’t determine the parameter group family to use based on your database’s version and engine',
    );
  }

  return triad[2];
}

/**
 * Provisions the service
 *
 * @param {AwsDatabaseDeployableProvisionable} provisionable the service's configuration
 * @param {Stack} stack the stack to deploy
 * @returns {Provisions} the provisions generated
 */
export const onDeployment: ProvisionHandler = (
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

  const paramGroup = new DbParameterGroup(stack.context, `${config.identifier}-params`, {
    ...params,
    family: getParamGroupFamily(config),
  });

  const dbInstance = new DbInstance(stack.context, config.name, {
    ...instance,
    allocatedStorage: config.storage,
    count: config.nodes,
    enabledCloudwatchLogsExports: RDS_LOG_EXPORTS_PER_ENGINE[config.engine],
    engine: config.engine,
    engineVersion: config.version,
    identifier: config.identifier,
    instanceClass: config.size,
    name: config.database,
    parameterGroupName: paramGroup.name,
    port: config.port,
    provider: providerInstance,
    dbSubnetGroupName: `db-subnet-${config.identifier}`,
    username: rootCredentials.username,
    password: rootCredentials.password,
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
  const base = pipe(
    withCredentials(),
    withRootCredentials(),
    withHandler('deployable', onDeployment),
  )(getAwsCloudService(type));

  return pipe(
    sizeable(RDS_INSTANCE_SIZES, DEFAULT_RDS_INSTANCE_SIZE),
    versioned(RDS_MAJOR_VERSIONS_PER_ENGINE[engine], RDS_DEFAULT_VERSIONS_PER_ENGINE[engine]),
    storable(),
    withEngine(engine),
    multiNode(),
    profilable(),
    withDatabase(),
  )(base);
};

export const AWSMySQL: AwsMySQLService = getDatabaseService(SERVICE_TYPE.MYSQL, 'mysql');
export const AWSPostgreSQL: AwsPostgreSQLService = getDatabaseService(SERVICE_TYPE.POSTGRESQL, 'postgres');
export const AWSMariaDB: AwsMariaDBService = getDatabaseService(SERVICE_TYPE.MARIADB, 'mariadb');
