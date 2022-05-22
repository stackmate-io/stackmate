import { TerraformProvider } from 'cdktf';

import { SERVICE_TYPE } from '@stackmate/engine/constants';
import { JsonSchema } from '@stackmate/engine/types/schema';
import { CloudStack, CredentialsObject } from '@stackmate/engine/types/lib';
import { Attribute, AttributesOf, BaseEntity, NonAttributesOf } from '@stackmate/engine/types/entity';
import { VaultCredentialOptions } from '@stackmate/engine/types/project';
import {
  ProviderChoice, ServiceScopeChoice, ServiceTypeChoice, ServiceAssociation,
} from '@stackmate/engine/types/service/util';

// Base services
export interface BaseCloudService extends BaseEntity {
  // Discrimination for the service
  readonly provider: Attribute<ProviderChoice>;
  readonly type: Attribute<ServiceTypeChoice>;
  // Attributes
  name: Attribute<string>;
  links: Attribute<string[]>;
  profile: Attribute<string>;
  overrides: Attribute<object>;
  providerService: BaseServices.Provider.Type;
  // Common across all services
  vault: BaseServices.Vault.Type;
  identifier: string;
  isRegistered(): boolean;
  link(...targets: BaseService.Type[]): BaseService.Type;
  scope(name: ServiceScopeChoice): BaseService.Type;
  associations(): ServiceAssociation[];
  isDependingUpon(service: BaseService.Type): boolean;
  register(stack: CloudStack): void;
  onPrepare(stack: CloudStack): void;
  onDeploy(stack: CloudStack): void;
  onDestroy(stack: CloudStack): void;
}

export interface BaseDatabaseService extends BaseCloudService {
  storage: Attribute<number>;
  port: Attribute<number>;
}

export interface BaseMySQLDatabaseService extends BaseDatabaseService {
  readonly type: Attribute<typeof SERVICE_TYPE.MYSQL>;
}

export interface BasePostgreSQLDatabaseService extends BaseDatabaseService {
  readonly type: Attribute<typeof SERVICE_TYPE.POSTGRESQL>;
}

export interface BaseMariaDBDatabaseService extends BaseDatabaseService {
  readonly type: Attribute<typeof SERVICE_TYPE.MARIADB>;
}

export interface BaseProviderService extends BaseCloudService {
  readonly type: Attribute<typeof SERVICE_TYPE.PROVIDER>;
  resource: TerraformProvider;
  bootstrap(stack: CloudStack): void;
  prerequisites(stack: CloudStack): void;
}

export interface BaseVaultService extends BaseCloudService {
  readonly type: Attribute<typeof SERVICE_TYPE.VAULT>;
  credentials(stack: CloudStack, service: string, opts?: VaultCredentialOptions): CredentialsObject;
}

export interface BaseStateService extends BaseCloudService {
  backend(stack: CloudStack): void;
  resources(stack: CloudStack): void;
}

export namespace BaseService {
  export type Attributes = AttributesOf<BaseCloudService>;
  export type Type = Attributes & NonAttributesOf<BaseCloudService>;
  export type Schema = JsonSchema<Attributes>;
}

export namespace BaseServices {
  export namespace Provider {
    export type Attributes = AttributesOf<BaseProviderService>;
    export type Type = Attributes & NonAttributesOf<BaseProviderService>;
    export type Schema = JsonSchema<Attributes>;
  }
  export namespace Vault {
    export type Attributes = AttributesOf<BaseVaultService>;
    export type Type = Attributes & NonAttributesOf<BaseVaultService>;
    export type Schema = JsonSchema<Attributes>;
  }
  export namespace State {
    export type Attributes = AttributesOf<BaseStateService>;
    export type Type = Attributes & NonAttributesOf<BaseStateService>;
    export type Schema = JsonSchema<Attributes>;
  }
  export namespace Database {
    export type Attributes = AttributesOf<BaseDatabaseService>;
    export type Type = Attributes & NonAttributesOf<BaseDatabaseService>;
    export type Schema = JsonSchema<Attributes>;
  }
  export namespace MySQL {
    export type Attributes = AttributesOf<BaseMySQLDatabaseService>;
    export type Type = Attributes & NonAttributesOf<BaseMySQLDatabaseService>;
    export type Schema = JsonSchema<Attributes>;
  }
  export namespace PostgreSQL {
    export type Attributes = AttributesOf<BasePostgreSQLDatabaseService>;
    export type Type = Attributes & NonAttributesOf<BasePostgreSQLDatabaseService>;
    export type Schema = JsonSchema<Attributes>;
  }
  export namespace MariaDB {
    export type Attributes = AttributesOf<BaseMariaDBDatabaseService>;
    export type Type = Attributes & NonAttributesOf<BaseMariaDBDatabaseService>;
    export type Schema = JsonSchema<Attributes>;
  }
}
