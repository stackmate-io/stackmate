import { PROVIDER } from '@stackmate/engine/constants';
import { RDS_ENGINES, RDS_INSTANCE_SIZES } from '@stackmate/engine/providers/aws/constants';
import { DatabaseServiceSchema, ProviderServiceSchema } from './base';
import { OneOf } from '../../util';
import { ProviderChoice } from '../../service';

const AWS = typeof PROVIDER.AWS as ProviderChoice;
type AWS_PROVIDER = typeof AWS;

export type AwsServiceSchemaG<T> = T & {
  readonly provider: AWS_PROVIDER;
  region: string;
}

export interface AwsProviderServiceSchema extends AwsServiceSchemaG<ProviderServiceSchema> {
  ip: string;
}

export interface AwsDatabaseServiceSchema extends DatabaseServiceSchema {
  size: OneOf<typeof RDS_INSTANCE_SIZES>;
  engine: OneOf<typeof RDS_ENGINES>;
  nodes: number;
}

export interface AwsMySQLDatabaseSchema extends AwsDatabaseServiceSchema {}

export interface AwsPostgreSQLDatabaseSchema extends AwsDatabaseServiceSchema {}

export interface AwsMariaDBDatabaseSchema extends AwsDatabaseServiceSchema {}
