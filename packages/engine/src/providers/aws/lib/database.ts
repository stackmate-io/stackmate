import pipe from '@bitty/pipe';
import { DbInstance, DbParameterGroup } from '@cdktf/provider-aws/lib/rds';

import { Stack } from '@stackmate/engine/core/stack';
import { ChoiceOf } from '@stackmate/engine/lib';
import { PROVIDER } from '@stackmate/engine/constants';
import { AwsService, getAwsCloudService } from '@stackmate/engine/providers/aws/lib/service';
import { withCredentials, withRootCredentials } from '@stackmate/engine/core/service/credentials';
import {
  DEFAULT_RDS_INSTANCE_SIZE, RdsEngine, RDS_DEFAULT_VERSIONS_PER_ENGINE,
  RDS_INSTANCE_SIZES, RDS_MAJOR_VERSIONS_PER_ENGINE, REGIONS,
} from '@stackmate/engine/providers/aws/constants';
import {
  CloudServiceAttributes, EngineAttributes, multiNode, MultiNodeAttributes, profilable,
  ProfilableAttributes, Provisionable, ProvisionAssociationRequirements, ProvisionHandler,
  RegionalAttributes, ServiceTypeChoice, sizeable, SizeableAttributes, storable,
  StorableAttributes, versioned, VersioningAttributes, withDatabase,
  withEngine, withHandler,
} from '@stackmate/engine/core/service';

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

export type AwsDatabaseService<T extends ServiceTypeChoice, E extends RdsEngine> = AwsService<AwsDatabaseAttributes<T, E>> & {
  type: T;
};

export type AwsDatabaseDeployableResources = {
  paramGroup: DbParameterGroup,
  dbInstance: DbInstance,
};
export type AwsDatabaseDestroyableResources = {};
export type AwsDatabasePreparableResources = {};

/**
 * Provisions the service
 *
 * @param {AwsPostgreSQLAttributes} config the service's configuration
 * @param {Stack} stack the stack to deploy
 * @param {ServiceRequirements} requirements the service's requirements
 * @returns {Provisions} the provisions generated
 */
export const onDeployment: ProvisionHandler = <P extends Provisionable>(
  provisionable: P, stack: Stack, requirements: ProvisionAssociationRequirements<P['service']['associations'], 'deployable'>,
): AwsDatabaseDeployableResources => {
  // const { kmsKey, providerInstance, credentials } = requirements;
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

/**
 * @param {ServiceTypeChoice} type the type of service to instantiate
 * @param {RdsEngine} engine the RDS engine to use
 * @returns {AwsDatabaseService<DatabaseAttributes>} the database service
 */
export const getDatabaseService = (
  type: ServiceTypeChoice, engine: RdsEngine,
): AwsDatabaseService<typeof type, typeof engine> => {
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
