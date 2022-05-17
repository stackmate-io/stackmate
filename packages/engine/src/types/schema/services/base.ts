import { Profilable, Sizeable, Storable } from './util';

export interface BaseServiceSchema extends Profilable {
  name: string;
  links: string[];
}

export interface DatabaseServiceSchema extends BaseServiceSchema, Sizeable, Storable {
  database: string;
  port: number;
}

export interface StateServiceSchema extends BaseServiceSchema {}

export interface ProviderServiceSchema extends BaseServiceSchema {}

export interface VaultServiceSchema extends BaseServiceSchema {}
