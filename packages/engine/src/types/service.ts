import { LocalBackend, S3Backend, TerraformProvider, TerraformResource } from 'cdktf';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import { Attribute, AttributesOf, BaseEntity, BaseEntityConstructor } from './entity';
import { CloudStack, CredentialsObject } from './lib';
import { VaultCredentialOptions } from './project';
import { OneOf, ChoiceOf, AbstractConstructorOf } from './util';
import { JsonSchema } from './schema';
import { AWS_REGIONS, RDS_ENGINES, RDS_INSTANCE_SIZES } from '../providers/aws/constants';
import { InternetGateway, Subnet, Vpc } from '@cdktf/provider-aws/lib/vpc';
import { KmsKey } from '@cdktf/provider-aws/lib/kms';
import { DbInstance, DbParameterGroup } from '@cdktf/provider-aws/lib/rds';

export type ProviderChoice = ChoiceOf<typeof PROVIDER>;
export type ServiceTypeChoice = ChoiceOf<typeof SERVICE_TYPE>;
export type ServiceScopeChoice = OneOf<['deployable', 'preparable', 'destroyable']>;
export type ServiceAssociationDeclarations = string[];
export type RegionList = { [name: string]: string; };

export type ServiceConfigurationDeclaration = {
  type: ServiceTypeChoice;
  provider?: ProviderChoice;
  region?: string;
  profile?: string;
  links?: ServiceAssociationDeclarations;
};

export type ServiceAttributes = {
  type: ServiceTypeChoice;
  provider: ProviderChoice;
  region: string;
  name: string;
  projectName: string;
  stageName: string;
  profile?: string;
  links?: ServiceAssociationDeclarations;
};

export type ServiceAssociation = {
  lookup: <T extends CloudService>(a: T) => boolean;
  handler: <T extends CloudService>(a: T) => void;
};

export interface CloudServiceConstructor extends BaseEntityConstructor<CloudService> {
  schema<T extends CloudServiceAttributes>(): JsonSchema<T>;
  defaults(): { [key: string]: any };
}

export type AbstractCloudServiceConstructor = AbstractConstructorOf<CloudService> & {
  schema<T extends CloudServiceAttributes>(): JsonSchema<T>;
}

export interface CloudServiceRegistry {
  items: { [k in ProviderChoice]?: { [s in ServiceTypeChoice]?: CloudServiceConstructor } };
  add(
    classConstructor: CloudServiceConstructor, provider: ProviderChoice, type: ServiceTypeChoice,
  ): void;
  get(provider: ProviderChoice, type: ServiceTypeChoice): CloudServiceConstructor;
}

export type CloudServiceAttributes = AttributesOf<CloudService>;

// Base services
export interface CloudService extends BaseEntity {
  // Discrimination for the service
  readonly provider: ProviderChoice;
  readonly type: ServiceTypeChoice;
  // Attributes
  name: Attribute<string>;
  links: Attribute<string[]>;
  profile: Attribute<string>;
  overrides: Attribute<object>;
  providerService: ProviderService;
  // Common across all services
  vault: VaultService;
  identifier: string;
  isRegistered(): boolean;
  link(...targets: CloudService[]): CloudService;
  scope(name: ServiceScopeChoice): CloudService;
  associations(): ServiceAssociation[];
  isDependingUpon(service: CloudService): boolean;
  register(stack: CloudStack): void;
  onPrepare(stack: CloudStack): void;
  onDeploy(stack: CloudStack): void;
  onDestroy(stack: CloudStack): void;
}

export interface DatabaseService extends CloudService {
  storage: Attribute<number>;
  port: Attribute<number>;
}

export interface MySQLDatabaseService extends DatabaseService {
  readonly type: typeof SERVICE_TYPE.MYSQL;
}

export interface PostgreSQLDatabaseService extends DatabaseService {
  readonly type: typeof SERVICE_TYPE.POSTGRESQL;
}

export interface MariaDBDatabaseService extends DatabaseService {
  readonly type: typeof SERVICE_TYPE.MARIADB;
}

export interface ProviderService extends CloudService {
  readonly type: typeof SERVICE_TYPE.PROVIDER;
  resource: TerraformProvider;
  bootstrap(stack: CloudStack): void;
  prerequisites(stack: CloudStack): void;
}

export interface VaultService extends CloudService {
  readonly type: typeof SERVICE_TYPE.VAULT;
  credentials(stack: CloudStack, service: string, opts?: VaultCredentialOptions): CredentialsObject;
}

export interface StateService extends CloudService {
  backend(stack: CloudStack): void;
  resources(stack: CloudStack): void;
}

// Local services
export type LocalService<Service extends CloudService> = Service & {
  readonly provider: typeof PROVIDER.LOCAL;
}
export type LocalStateService = LocalService<StateService> & {
  directory: Attribute<string>;
  backendResource: LocalBackend;
  get path(): string;
};

// Aws Services
export type AwsService<Service extends CloudService> = Service & {
  readonly provider: typeof PROVIDER.AWS;
  region: typeof AWS_REGIONS[keyof typeof AWS_REGIONS];
}

export type AwsCloudService = AwsService<CloudService>;
export type AwsVaultService = AwsService<VaultService> & {};
export type AwsProviderService = AwsService<ProviderService> & {
  vpc: Vpc;
  subnets: Subnet[];
  gateway: InternetGateway;
  key: KmsKey;
};
export type AwsStateService = AwsService<StateService> & {
  bucket: Attribute<string>;
  bucketResource: TerraformResource;
  backendResource: S3Backend;
};
export type AwsDatabaseService = AwsService<DatabaseService> & {
  size: Attribute<OneOf<typeof RDS_INSTANCE_SIZES>>;
  nodes: Attribute<number>;
  database: Attribute<string>;
  engine: Attribute<OneOf<typeof RDS_ENGINES>>;
  version: Attribute<string>;
  port: Attribute<number>;
  instance: DbInstance;
  paramGroup: DbParameterGroup;
};
export type AwsMySQLDatabaseService = MySQLDatabaseService & AwsDatabaseService & {
  engine: 'mysql';
};
export type AwsPostgreSQLDatabaseService = PostgreSQLDatabaseService & AwsDatabaseService & {
  engine: 'postgres';
};
export type AwsMariaDBDatabaseService = PostgreSQLDatabaseService & AwsDatabaseService & {
  engine: 'mariadb';
}
