import { pipe } from 'lodash/fp';
import { DbInstance, DbParameterGroup } from '@cdktf/provider-aws/lib/rds';

import { OneOf } from '@stackmate/engine/types';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import {
  RdsEngine,
  REGIONS,
  RDS_INSTANCE_SIZES,
  DEFAULT_RDS_INSTANCE_SIZE,
  RDS_DEFAULT_VERSIONS_PER_ENGINE,
  RDS_MAJOR_VERSIONS_PER_ENGINE,
  DEFAULT_REGION,
} from '@stackmate/engine/providers/aws/constants';
import {
  AwsProviderAttributes,
  AwsProviderDeployableProvisions,
  ProviderProvisionable,
} from '@stackmate/engine/providers/aws/services/provider';
import {
  CloudServiceAttributes, getCloudService, versioned, Service, withEngine, withRegions, multiNode, storable, profilable, withHandler,
  EngineAttributes, RegionalAttributes, VersioningAttributes,
  MultiNodeAttributes, StorableAttributes, ProfilableAttributes, ProvisionHandler,
  ServiceAssociation, sizeable, SizeableAttributes, withDatabase, ProvisionAssociationRequirements,
} from '@stackmate/engine/core/service';

const engine: RdsEngine = 'postgres';

export type AwsPostgreSQLAttributes = CloudServiceAttributes
  & EngineAttributes<typeof engine>
  & RegionalAttributes<OneOf<typeof REGIONS>>
  & SizeableAttributes
  & VersioningAttributes
  & MultiNodeAttributes
  & StorableAttributes
  & ProfilableAttributes & {
  provider: typeof PROVIDER.AWS,
  type: typeof SERVICE_TYPE.POSTGRESQL;
  database: string;
};

export type AWSPostgreSQLDeployableProvisions = {
  paramGroup: DbParameterGroup
  dbInstance: DbInstance,
};

type DatabaseAssociations = {
  awsProvider: ServiceAssociation<typeof SERVICE_TYPE.PROVIDER, 'deployable', Pick<AwsProviderDeployableProvisions, 'provider'>>,
};

export type AWSPostgreSQLService = Service<AwsPostgreSQLAttributes, DatabaseAssociations>;

const associations: DatabaseAssociations = {
  awsProvider: {
    from: SERVICE_TYPE.PROVIDER,
    scope: 'deployable',
    where: (config: AwsPostgreSQLAttributes, linked: AwsProviderAttributes) => (
      config.provider === linked.provider && config.region === linked.region
    ),
    handler: (provider: ProviderProvisionable, stack) => {
    },
  },
  credentials: {},
  masterCredentials: {},
};

const base = pipe(
  // associate<AwsPostgreSQLAttributes>(...associations),
)(getCloudService(PROVIDER.AWS, SERVICE_TYPE.POSTGRESQL));

/**
 * Provisions the service
 *
 * @param {AwsPostgreSQLAttributes} config the service's configuration
 * @param {Stack} stack the stack to deploy
 * @param {ServiceRequirements} requirements the service's requirements
 * @returns {Provisions} the provisions generated
 */
export const onDeployment: ProvisionHandler<AwsPostgreSQLAttributes, AWSPostgreSQLDeployableProvisions> = (
  config, stack, requirements: ProvisionAssociationRequirements<DatabaseAssociations, 'deployable'>,
) => {
  const { awsProvider: { provider }  } = requirements;
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

  return { instance: '', paramGroup: '' };
};

export const AWSPostgreSQL: Service<AwsPostgreSQLAttributes> = pipe(
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

export default AWSPostgreSQL;
