import { InternetGateway, Subnet, Vpc } from '@cdktf/provider-aws/lib/vpc';
import { KmsKey } from '@cdktf/provider-aws/lib/kms';
import { ProviderService } from './base';
import {
  AwsProviderServiceSchema,
  AwsDatabaseServiceSchema,
  AwsMySQLDatabaseSchema,
} from '../schema';

export interface AwsProviderService extends ProviderService, AwsProviderServiceSchema {
  key: KmsKey;
  vpc: Vpc;
  subnets: Subnet[];
  gateway: InternetGateway;
}

export interface AwsDatabaseService extends AwsDatabaseServiceSchema {}

export interface AwsMySQLDatabaseService extends AwsMySQLDatabaseSchema {};
