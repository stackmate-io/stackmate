import { pipe } from 'lodash/fp';

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
  CloudServiceAttributes, getCloudService, sizeable, versioned, withDatabase,
  Service, ofEngine, inRegions, multiNode, storable, profilable, withHandler,
  EngineAttributes, RegionalAttributes, SizeableAttributes, VersionableAttributes,
  MultiNodeAttributes, StorableAttributes, ProfilableAttributes, ProvisionHandler,
} from '@stackmate/engine/core/service';

const engine: RdsEngine = 'postgres';

export type AwsPostgreSQLAttributes = CloudServiceAttributes
  & EngineAttributes<typeof engine>
  & RegionalAttributes<OneOf<typeof REGIONS>>
  & SizeableAttributes
  & VersionableAttributes
  & MultiNodeAttributes
  & StorableAttributes
  & ProfilableAttributes & {
  provider: typeof PROVIDER.AWS,
  type: typeof SERVICE_TYPE.POSTGRESQL;
  database: string;
};

const base = getCloudService(PROVIDER.AWS, SERVICE_TYPE.POSTGRESQL);

/**
 * Provisions the service
 *
 * @param {AwsPostgreSQLAttributes} config the service's configuration
 * @param {Stack} stack the stack to deploy
 * @param {ServiceRequirements} requirements the service's requirements
 * @returns {Provisions} the provisions generated
 */
export const onDeployment: ProvisionHandler<AwsPostgreSQLAttributes> = (
  config, stack, requirements,
) => {
};

export const AWSPostgreSQL: Service<AwsPostgreSQLAttributes> = pipe(
  inRegions(REGIONS, DEFAULT_REGION),
  sizeable(RDS_INSTANCE_SIZES, DEFAULT_RDS_INSTANCE_SIZE),
  versioned(RDS_MAJOR_VERSIONS_PER_ENGINE[engine], RDS_DEFAULT_VERSIONS_PER_ENGINE[engine]),
  storable(),
  ofEngine(engine),
  multiNode(),
  profilable(),
  withDatabase(),
  withHandler('deployable', onDeployment),
)(base);

export default AWSPostgreSQL;
