import { SERVICE_TYPE } from '@stackmate/engine/constants';
import { JsonSchema } from '@stackmate/engine/types/schema';
import { CloudStack, CredentialsObject } from '@stackmate/engine/types/lib';
import { Attribute, AttributesOf, BaseEntity, NonAttributesOf } from '@stackmate/engine/types/entity';
import { EnvironmentVariable } from '@stackmate/engine/types/operation';
import {
  ProviderChoice,
  ServiceScopeChoice,
  ServiceTypeChoice,
  ServiceAssociations,
  VaultCredentialOptions,
  CloudProviderChoice,
} from '@stackmate/engine/types/service/util';

export type ServicePrerequisites = {
  provider?: BaseServices.Provider.Type;
  vault?: BaseServices.Vault.Type;
};

export interface BaseCloudService extends BaseEntity {
  readonly provider: Attribute<ProviderChoice>;
  readonly type: Attribute<ServiceTypeChoice>;
  name: Attribute<string>;
  links: Attribute<string[]>;
  profile: Attribute<string>;
  overrides: Attribute<object>;
  identifier: string;
  region?: Attribute<string>;
  scope(name: ServiceScopeChoice): BaseService.Type;
  environment(): EnvironmentVariable[];
  associations(): ServiceAssociations;
  onPrepare(stack: CloudStack, prerequisites: ServicePrerequisites): void;
  onDeploy(stack: CloudStack, prerequisites: ServicePrerequisites): void;
  onDestroy(stack: CloudStack, prerequisites: ServicePrerequisites): void;
  provisions(stack: CloudStack, prerequisites: ServicePrerequisites): void;
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
  bootstrap(stack: CloudStack): void;
  prerequisites(stack: CloudStack): void;
}

export interface BaseVaultService extends BaseCloudService {
  readonly provider: Attribute<CloudProviderChoice>;
  readonly type: Attribute<typeof SERVICE_TYPE.VAULT>;
  credentials(stack: CloudStack, service: string, opts?: VaultCredentialOptions): CredentialsObject;
}

export interface BaseStateService extends BaseCloudService {
  readonly type: Attribute<typeof SERVICE_TYPE.STATE>;
  backend(stack: CloudStack): void;
  resources(stack: CloudStack): void;
}

export namespace BaseService {
  export type Attributes = AttributesOf<BaseCloudService>;
  export type Type = Attributes & NonAttributesOf<BaseCloudService>;
  export type Schema = JsonSchema<Attributes>;
  export type Defaults = Omit<Attributes, 'provider' | 'type'>;
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
