import { AWS } from './aws';
import { Local } from './local'
import { CoreServiceConfiguration } from './util';

export { AWS, Local };
export * from './base';
export * from './util';

// Generic union types
export type VaultServiceAttributes = AWS.Vault.Attributes;
export type StateServiceAttributes = AWS.State.Attributes | Local.State.Attributes;
export type ProviderSerivceAttributes = AWS.Provider.Attributes | Local.Provider.Attributes;
export type CloudServiceAttributes = AWS.MySQL.Attributes
  | AWS.PostgreSQL.Attributes
  | AWS.MariaDB.Attributes;

// types for project configuration
export type VaultServiceConfiguration = CoreServiceConfiguration<AWS.Vault.Attributes>;
export type StateServiceConfiguration = CoreServiceConfiguration<AWS.State.Attributes>
  | CoreServiceConfiguration<Local.State.Attributes>;
