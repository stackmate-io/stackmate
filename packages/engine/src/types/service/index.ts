import { AWS } from './aws';
import { Local } from './local'
import { OneOfType } from '../util';
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

export type AvailableServiceChoice = Pick<CloudServiceAttributes, 'type'>['type'];

// types for project configuration
export type VaultServiceConfiguration = CoreServiceConfiguration<AWS.Vault.Attributes>;
export type AwsStateConfiguration = CoreServiceConfiguration<AWS.State.Attributes>;
export type LocalStateConfiguration = CoreServiceConfiguration<Local.State.Attributes>;
export type StateServiceConfiguration = OneOfType<[AwsStateConfiguration, LocalStateConfiguration]>;
