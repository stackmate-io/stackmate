import { RdsEngine } from '@stackmate/engine/providers/aws/constants';
import { SERVICE_TYPE } from '@stackmate/engine/constants';
import { ServiceScopeChoice, ServiceTypeChoice } from '@stackmate/engine/core/service';
import {
  AwsDatabaseAttributes,
  AwsDatabaseProvisionable,
  AwsDatabaseService,
  getDatabaseService,
} from '@stackmate/engine/providers/aws/lib/database';

const engine: RdsEngine = 'postgres';
const serviceType: ServiceTypeChoice = SERVICE_TYPE.POSTGRESQL;

export type AwsPostgreSQLAttributes = AwsDatabaseAttributes<typeof serviceType, typeof engine>;
export type AwsPostgreSQLService = AwsDatabaseService<AwsPostgreSQLAttributes>
export const AWSPostgreSQL: AwsPostgreSQLService = getDatabaseService(
  serviceType, engine
);
export type AwsPostgreSqlProvisionable<S extends ServiceScopeChoice> = AwsDatabaseProvisionable<
  S, AwsPostgreSQLAttributes, AwsPostgreSQLService
>;
export default AWSPostgreSQL;
