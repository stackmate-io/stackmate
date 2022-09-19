import pipe from '@bitty/pipe';
import { DbInstance, DbParameterGroup } from '@cdktf/provider-aws/lib/rds';

import { ChoiceOf } from '@stackmate/engine/lib';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import { AwsProviderDeployableResources } from '@stackmate/engine/providers/aws/services/provider';
import {
  DEFAULT_RDS_INSTANCE_SIZE, DEFAULT_REGION, RdsEngine, RDS_DEFAULT_VERSIONS_PER_ENGINE,
  RDS_INSTANCE_SIZES, RDS_MAJOR_VERSIONS_PER_ENGINE, REGIONS,
} from '@stackmate/engine/providers/aws/constants';
import {
  associate, CloudServiceAttributes, EngineAttributes, getCloudService,
  multiNode, MultiNodeAttributes, profilable, ProfilableAttributes,
  ProvisionAssociationRequirements, ProvisionHandler, RegionalAttributes, Service,
  ServiceAssociation, ServiceTypeChoice, sizeable, SizeableAttributes, storable,
  StorableAttributes, versioned, VersioningAttributes, withDatabase,
  withEngine, withHandler, withRegions,
} from '@stackmate/engine/core/service';
import { KmsKey } from '@cdktf/provider-aws/lib/kms';
import { AwsProvider } from '@cdktf/provider-aws';

type DatabaseAttributes = CloudServiceAttributes
  & EngineAttributes<RdsEngine>
  & RegionalAttributes<ChoiceOf<typeof REGIONS>>
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
  kmsKey: ServiceAssociation<typeof SERVICE_TYPE.PROVIDER, 'deployable', KmsKey>,
  providerInstance: ServiceAssociation<typeof SERVICE_TYPE.PROVIDER, 'deployable', AwsProvider>;
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
  const { kmsKey, providerInstance } = requirements;
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
  kmsKey: {
    from: SERVICE_TYPE.PROVIDER,
    scope: 'deployable',
    handler: (r: AwsProviderDeployableResources): KmsKey => r.kmsKey,
  },
  providerInstance: {
    from: SERVICE_TYPE.PROVIDER,
    scope: 'deployable',
    handler: (r: AwsProviderDeployableResources): AwsProvider => r.provider,
  },
  // credentials: {},
  // securityGroups
};


/**
 *
 * @param {ServiceTypeChoice} type the type of service to instantiate
 * @param {RdsEngine} engine the RDS engine to use
 * @returns {AwsDatabaseService<DatabaseAttributes>} the database service
 */
export const getDatabaseService = (
  type: ServiceTypeChoice, engine: RdsEngine,
): AwsDatabaseService<DatabaseAttributes> => {
  const base = pipe(
    associate(associations),
    withRegions(REGIONS, DEFAULT_REGION),
    withHandler('deployable', onDeployment),
  )(getCloudService(PROVIDER.AWS, type))

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
