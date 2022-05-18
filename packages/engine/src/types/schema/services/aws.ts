import { RDS_ENGINES, RDS_INSTANCE_SIZES } from '@stackmate/engine/providers/aws/constants';
import { BaseServiceSchema, DatabaseServiceSchema, ProviderServiceSchema } from './base';
import { MultiNode } from './util';
import { OneOf } from '../../util';

export interface AwsServiceSchema extends BaseServiceSchema {
  provider: 'aws';
  region: string;
}

export interface AwsProviderServiceSchema extends ProviderServiceSchema {
  ip: string;
}

export interface AwsDatabaseServiceSchema extends DatabaseServiceSchema, MultiNode {
  provider: 'aws';
  size: OneOf<typeof RDS_INSTANCE_SIZES>;
  engine: OneOf<typeof RDS_ENGINES>;
}

export interface AwsMySQLDatabaseSchema extends AwsDatabaseServiceSchema {}

export interface AwsPostgreSQLDatabaseSchema extends AwsDatabaseServiceSchema {}

export interface AwsMariaDBDatabaseSchema extends AwsDatabaseServiceSchema {}
