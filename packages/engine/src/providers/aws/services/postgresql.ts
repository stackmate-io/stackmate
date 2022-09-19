import { RdsEngine } from '@stackmate/engine/providers/aws/constants';
import { SERVICE_TYPE } from '@stackmate/engine/constants';
import { ServiceTypeChoice } from '@stackmate/engine/core/service';
import {
  AwsDatabaseAttributes,
  AwsDatabaseService,
  getDatabaseService,
} from '@stackmate/engine/providers/aws/lib/database';

const engine: RdsEngine = 'postgres';
const serviceType: ServiceTypeChoice = SERVICE_TYPE.POSTGRESQL;

export type AwsPostgreSQLAttributes = AwsDatabaseAttributes<typeof serviceType, typeof engine>;

export const AWSPostgreSQL: AwsDatabaseService<AwsPostgreSQLAttributes> = getDatabaseService(
  serviceType, engine
);

export default AWSPostgreSQL;
