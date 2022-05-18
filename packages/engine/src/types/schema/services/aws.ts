import { PROVIDER } from '@stackmate/engine/constants';
import { RDS_ENGINES, RDS_INSTANCE_SIZES } from '@stackmate/engine/providers/aws/constants';
import { BaseServiceSchema, ProviderServiceSchema } from './base';
import { OneOf } from '../../util';
import { ProviderChoice } from '../../service';

const AWS = typeof PROVIDER.AWS as ProviderChoice;
type AWS_PROVIDER = typeof AWS;

export type AwsServiceSchemaG<T> = T & {
  provider: AWS_PROVIDER;
  region: string;
}

export interface AwsServiceSchema extends BaseServiceSchema {
  provider: AWS_PROVIDER;
  region: string;
}

export interface AwsProviderServiceSchema extends ProviderServiceSchema {
  ip: string;
}

export interface AwsDatabaseServiceSchema extends BaseServiceSchema {
  size: OneOf<typeof RDS_INSTANCE_SIZES>;
  engine: OneOf<typeof RDS_ENGINES>;
  nodes: number;
}

export interface AwsMySQLDatabaseSchema extends AwsDatabaseServiceSchema {}

export interface AwsPostgreSQLDatabaseSchema extends AwsDatabaseServiceSchema {}

export interface AwsMariaDBDatabaseSchema extends AwsDatabaseServiceSchema {}
