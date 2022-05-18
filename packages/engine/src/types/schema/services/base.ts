import { Connectable, Profilable, Storable } from './util';

export interface BaseServiceSchema extends Profilable {
  name: string;
  links: string[];
}

export interface DatabaseServiceSchema extends BaseServiceSchema, Storable, Connectable {
  database: string;
}

export interface StateServiceSchema extends BaseServiceSchema {}

export interface ProviderServiceSchema extends BaseServiceSchema {}

export interface VaultServiceSchema extends BaseServiceSchema {}
