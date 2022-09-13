import { pipe } from 'lodash/fp';

import { OneOf } from '@stackmate/engine/types';
import { Service, ofEngine, inRegions } from '@stackmate/engine/core/service';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import { CloudServiceAttributes, getCloudService, sizeable, versioned } from '@stackmate/engine/core/service';
import {
  RdsEngine,
  REGIONS,
  RDS_INSTANCE_SIZES,
  DEFAULT_RDS_INSTANCE_SIZE,
  RDS_DEFAULT_VERSIONS_PER_ENGINE,
  RDS_MAJOR_VERSIONS_PER_ENGINE,
  DEFAULT_REGION,
} from '@stackmate/engine/providers/aws/constants';

const engine: RdsEngine = 'postgres';

export type AwsPostgreSQLAttributes = CloudServiceAttributes & {
  provider: typeof PROVIDER.AWS,
  type: typeof SERVICE_TYPE.POSTGRESQL;
  engine: typeof engine;
  region: OneOf<typeof REGIONS>;
  size: string;
  version: string;
};

const base = getCloudService(PROVIDER.AWS, SERVICE_TYPE.POSTGRESQL);

export const AWSPostgreSQL: Service<AwsPostgreSQLAttributes> = pipe(
  inRegions(REGIONS, DEFAULT_REGION),
  sizeable(RDS_INSTANCE_SIZES, DEFAULT_RDS_INSTANCE_SIZE),
  versioned(RDS_MAJOR_VERSIONS_PER_ENGINE[engine], RDS_DEFAULT_VERSIONS_PER_ENGINE[engine]),
  ofEngine(engine),
)(base);

export default AWSPostgreSQL;
