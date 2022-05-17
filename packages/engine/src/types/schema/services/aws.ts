import { RDS_ENGINES } from '@stackmate/engine/providers/aws/constants';
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
  engine: OneOf<typeof RDS_ENGINES>;
  nodes: number;
  // version: { type: 'string' },
}

export interface AwsMySQLDatabaseSchema extends AwsDatabaseServiceSchema {
  engine: 'mysql';
}

export interface AwsPostgreSQLDatabaseSchema extends AwsDatabaseServiceSchema {

}

export interface AwsMariaDBDatabaseSchema extends AwsDatabaseServiceSchema {

}
