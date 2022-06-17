import { AWS } from './aws';
import { Local } from './local'

export { AWS, Local };
export * from './base';
export * from './util';

export type VaultServiceAttributes = AWS.Vault.Attributes;
export type StateServiceAttributes = AWS.State.Attributes | Local.State.Attributes;
export type CloudServiceAttributes = AWS.MySQL.Attributes
  | AWS.PostgreSQL.Attributes
  | AWS.MariaDB.Attributes;
