import { pipe } from 'lodash/fp';
import { DbInstance, DbParameterGroup } from '@cdktf/provider-aws/lib/rds';

import { OneOf } from '@stackmate/engine/types';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import { AwsProviderDeployableProvisions, AwsProviderProvisionable } from '@stackmate/engine/providers/aws/services/provider';
import {
  DEFAULT_RDS_INSTANCE_SIZE, DEFAULT_REGION, RdsEngine, RDS_DEFAULT_VERSIONS_PER_ENGINE,
  RDS_INSTANCE_SIZES, RDS_MAJOR_VERSIONS_PER_ENGINE, REGIONS,
} from '@stackmate/engine/providers/aws/constants';
import {
  associate,
  BaseServiceAttributes, CloudServiceAttributes, EngineAttributes, getCloudService, multiNode,
  MultiNodeAttributes, profilable, ProfilableAttributes, ProvisionAssociationRequirements,
  ProvisionHandler, RegionalAttributes, Service, ServiceAssociation, ServiceTypeChoice, sizeable,
  SizeableAttributes, storable, StorableAttributes, versioned, VersioningAttributes, withDatabase,
  withEngine, withHandler, withRegions,
} from '@stackmate/engine/core/service';

type DatabaseAttributes = CloudServiceAttributes
  & EngineAttributes<RdsEngine>
  & RegionalAttributes<OneOf<typeof REGIONS>>
  & SizeableAttributes
  & VersioningAttributes
  & MultiNodeAttributes
  & StorableAttributes
  & ProfilableAttributes & {
    provider: typeof PROVIDER.AWS,
    database: string;
  };

export type AwsDatabaseAttributes<
  T extends ServiceTypeChoice, E extends RdsEngine
> = DatabaseAttributes & EngineAttributes<E> & { type: T; };

export type AwsDatabaseDeployableProvisions = {
  paramGroup: DbParameterGroup,
  dbInstance: DbInstance,
};

type DatabaseAssociations = {
  awsProvider: ServiceAssociation<
    typeof SERVICE_TYPE.PROVIDER, 'deployable', Pick<AwsProviderDeployableProvisions, 'provider'>
  >,
};

export type AwsDatabaseService<T extends DatabaseAttributes> = Service<T> & {
  associations: DatabaseAssociations;
};

/**
 * Provisions the service
 *
 * @param {AwsPostgreSQLAttributes} config the service's configuration
 * @param {Stack} stack the stack to deploy
 * @param {ServiceRequirements} requirements the service's requirements
 * @returns {Provisions} the provisions generated
 */
export const onDeployment: ProvisionHandler = (
  config, stack, requirements: ProvisionAssociationRequirements<DatabaseAssociations, 'deployable'>,
): AwsDatabaseDeployableProvisions => {
  const { awsProvider: { provider } } = requirements;
  /*
  const { instance, params } = this.resourceProfile;
  const { username, password } = vault.credentials(stack, provider, this.name, { root: true });

  this.paramGroup = new DbParameterGroup(stack, `${this.identifier}-params`, {
    ...params,
    family: this.paramGroupFamily,
  });

  this.instance = new DbInstance(stack, this.name, {
    ...instance,
    allocatedStorage: this.storage,
    count: this.nodes,
    enabledCloudwatchLogsExports: RDS_LOG_EXPORTS_PER_ENGINE.get(this.engine),
    engine: this.engine,
    engineVersion: this.version,
    identifier: this.identifier,
    instanceClass: this.size,
    name: this.database,
    parameterGroupName: this.paramGroup.name,
    port: this.port,
    provider: provider.resource,
    dbSubnetGroupName: `db-subnet-${this.identifier}`,
    username,
    password,
    lifecycle: {
      createBeforeDestroy: true,
    },
  });
  */

  return { dbInstance: '', paramGroup: '' };
};

const associations: DatabaseAssociations = {
  awsProvider: {
    from: SERVICE_TYPE.PROVIDER,
    scope: 'deployable',
    where: (config: BaseServiceAttributes, linked: BaseServiceAttributes) => (
      config.provider === linked.provider && config.region === linked.region
    ),
    handler: (provider: AwsProviderProvisionable, stack) => {
    },
  },
  credentials: {},
  masterCredentials: {},
};

export const getDatabaseService = <T extends DatabaseAttributes>(
  type: ServiceTypeChoice, engine: RdsEngine,
): Service<T> => {
  const base = pipe(
    associate(associations),
  )(getCloudService(PROVIDER.AWS, type));

  const service = pipe(
    withRegions(REGIONS, DEFAULT_REGION),
    sizeable(RDS_INSTANCE_SIZES, DEFAULT_RDS_INSTANCE_SIZE),
    versioned(RDS_MAJOR_VERSIONS_PER_ENGINE[engine], RDS_DEFAULT_VERSIONS_PER_ENGINE[engine]),
    storable(),
    withEngine(engine),
    multiNode(),
    profilable(),
    withDatabase(),
    withHandler('deployable', onDeployment),
  )(base);

  return service;
};
