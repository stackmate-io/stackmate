import { AwsProvider as TerraformAwsProvider } from '@cdktf/provider-aws';
import { InternetGateway, Subnet, Vpc } from '@cdktf/provider-aws/lib/vpc';
import { DbInstance, DbParameterGroup } from '@cdktf/provider-aws/lib/rds';
import { KmsKey } from '@cdktf/provider-aws/lib/kms';

import { PROVIDER } from '@stackmate/engine/constants';
import { JsonSchema } from '@stackmate/engine/types/schema';
import { Attribute, AttributesOf, NonAttributesOf } from '@stackmate/engine/types/entity';
import { AWS_REGIONS, RDS_ENGINES, RDS_INSTANCE_SIZES } from '@stackmate/engine/providers/aws/constants';
import { CloudStack } from '@stackmate/engine/types/lib';
import { RequireKeys } from '@stackmate/engine/types/util';
import {
  BaseCloudService, BaseProviderService, BaseVaultService, BaseDatabaseService, BaseStateService,
  BaseMySQLDatabaseService, BasePostgreSQLDatabaseService, BaseMariaDBDatabaseService,
} from '@stackmate/engine/types/service/base';

export type AwsServicePrerequisites = {
  provider?: AWS.Provider.Type;
  vault?: AWS.Vault.Type;
};

type AwsService<Srv extends BaseCloudService> = Srv & {
  readonly provider: Attribute<typeof PROVIDER.AWS>;
  region: Attribute<typeof AWS_REGIONS[keyof typeof AWS_REGIONS]>;
  onPrepare(stack: CloudStack, prerequisites: AwsServicePrerequisites): void;
  onDeploy(stack: CloudStack, prerequisites: AwsServicePrerequisites): void;
  onDestroy(stack: CloudStack, prerequisites: AwsServicePrerequisites): void;
  provisions(stack: CloudStack, prerequisites: AwsServicePrerequisites): void;
};

type AwsBaseService = AwsService<BaseCloudService>;

type AwsProviderService = AwsService<BaseProviderService> & {
  ip: Attribute<string>;
  vpc: Vpc;
  subnets: Subnet[];
  gateway: InternetGateway;
  key: KmsKey;
  resource: TerraformAwsProvider,
  bootstrap(stack: CloudStack, prerequisites: AwsServicePrerequisites): void;
  prerequisites(stack: CloudStack, prerequisites: AwsServicePrerequisites): void;
};

type AwsStateService = AwsService<BaseStateService> & {
  bucket: Attribute<string>;
  resources(stack: CloudStack, prerequisites: RequireKeys<AwsServicePrerequisites, 'provider'>): void;
  backend(stack: CloudStack, prerequisites: RequireKeys<AwsServicePrerequisites, 'provider'>): void;
};

type AwsDatabaseService<Srv extends BaseDatabaseService = BaseDatabaseService> = AwsService<Srv> & {
  readonly engine: typeof RDS_ENGINES[number];
  size: Attribute<typeof RDS_INSTANCE_SIZES[number]>;
  nodes: Attribute<number>;
  database: Attribute<string>;
  version: Attribute<string>;
  port: Attribute<number>;
  instance: DbInstance;
  paramGroup: DbParameterGroup;
};

type AwsVaultService = AwsService<BaseVaultService>;

type AwsMySQLDatabaseService = AwsDatabaseService<BaseMySQLDatabaseService> & {
  readonly engine: Extract<typeof RDS_ENGINES[number], 'mysql'>;
};

type AwsPostgreSQLDatabaseService = AwsDatabaseService<BasePostgreSQLDatabaseService> & {
  engine: Extract<typeof RDS_ENGINES[number], 'postgres'>;
};

type AwsMariaDBDatabaseService = AwsDatabaseService<BaseMariaDBDatabaseService> & {
  engine: Extract<typeof RDS_ENGINES[number], 'mariadb'>;
};

export namespace AWS {
  export namespace Base {
    export type Attributes = AttributesOf<AwsBaseService>;
    export type Type = Attributes & NonAttributesOf<AwsBaseService>;
    export type Schema = JsonSchema<Attributes>;
  }
  export namespace Provider {
    export type Attributes = AttributesOf<AwsProviderService>;
    export type Type = Attributes & NonAttributesOf<AwsProviderService>;
    export type Schema = JsonSchema<Attributes>;
  }
  export namespace State {
    export type Attributes = AttributesOf<AwsStateService>;
    export type Type = Attributes & NonAttributesOf<AwsStateService>;
    export type Schema = JsonSchema<Attributes>;
  }
  export namespace Vault {
    export type Attributes = AttributesOf<AwsVaultService>;
    export type Type = Attributes & NonAttributesOf<AwsVaultService>;
    export type Schema = JsonSchema<Attributes>;
  }
  export namespace Database {
    export type Attributes = AttributesOf<AwsDatabaseService>;
    export type Type = Attributes & NonAttributesOf<AwsDatabaseService>;
    export type Schema = JsonSchema<Attributes>;
  }
  export namespace MySQL {
    export type Attributes = AttributesOf<AwsMySQLDatabaseService>;
    export type Type = Attributes & NonAttributesOf<AwsMySQLDatabaseService>;
    export type Schema = JsonSchema<Attributes>;
  }
  export namespace PostgreSQL {
    export type Attributes = AttributesOf<AwsPostgreSQLDatabaseService>;
    export type Type = Attributes & NonAttributesOf<AwsPostgreSQLDatabaseService>;
    export type Schema = JsonSchema<Attributes>;
  }
  export namespace MariaDB {
    export type Attributes = AttributesOf<AwsMariaDBDatabaseService>;
    export type Type = Attributes & NonAttributesOf<AwsMariaDBDatabaseService>;
    export type Schema = JsonSchema<Attributes>;
  }
}
