import { AWS } from './aws';
import { Local } from './local'
import { CoreServiceConfiguration } from './util';

export { AWS, Local };
export { BaseServices, BaseService } from './base';
export * from './util';

export type VaultServiceAttributes = CoreServiceConfiguration<AWS.Vault.Attributes>;
export type StateServiceAttributes = CoreServiceConfiguration<AWS.State.Attributes>;
export type CloudServiceAttributes = AWS.MySQL.Attributes
  | AWS.PostgreSQL.Attributes
  | AWS.MariaDB.Attributes;
