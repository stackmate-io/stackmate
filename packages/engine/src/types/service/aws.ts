import {
  AwsProviderServiceSchema,
  AwsDatabaseServiceSchema,
  AwsServiceSchema,
  AwsMySQLDatabaseSchema,
} from '../schema';

export interface AwsServiceWrapped extends AwsServiceSchema {}

export interface AwsProviderService extends AwsProviderServiceSchema {}

export interface AwsDatabaseService extends AwsDatabaseServiceSchema {}

export interface AwsMySQLDatabaseService extends AwsMySQLDatabaseSchema {};
