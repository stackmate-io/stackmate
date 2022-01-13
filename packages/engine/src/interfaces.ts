import { App as TerraformApp, TerraformStack } from 'cdktf';

import {
  ProviderChoice, RegionList, ServiceAssociation, AttributeParsers,
  ServiceMapping, ServiceTypeChoice, CloudPrerequisites, Validations,
  CredentialsObject, EntityAttributes, ServiceAttributes,
} from '@stackmate/types';

export interface BaseEntity {
  attributes: EntityAttributes;
  parsers(): AttributeParsers;
  validate(): void;
  validations(): Validations;
  getAttribute(name: string): any;
  setAttribute(name: string, value: any): void;
}

export interface Provisionable extends BaseEntity {
  isProvisioned: boolean;
  provision(): void;
}

export interface CloudProvider extends Provisionable {
  prerequisites: CloudPrerequisites;
  readonly provider: ProviderChoice;
  readonly regions: RegionList;
  readonly serviceMapping: ServiceMapping;
  service(type: ServiceTypeChoice, attributes: ServiceAttributes): CloudService;
  validations(): Validations & Required<{ region: object }>;
}

export interface CloudService extends Provisionable {
  readonly name: string;
  readonly provider: ProviderChoice;
  readonly type: ServiceTypeChoice;
  readonly associations: Array<ServiceAssociation>;
  links: Array<string>;
  stage: string;
  region: string;
  dependencies: CloudPrerequisites;
  link(target: CloudService): void;
  parsers(): AttributeParsers & Required<{ name: Function, region: Function, links: Function }>;
  validations(): Validations & Required<{ name: object, region: object, links: object }>;
}

export interface CloudServiceConstructor extends CloudService {
  new(...args: any[]): CloudService;
  factory(attrs: ServiceAttributes, stack: CloudStack, prereqs: CloudPrerequisites): CloudService;
}

export interface Sizeable extends BaseEntity {
  size: string;
  parsers(): AttributeParsers & Required<{ size: Function }>;
  validations(): Validations & Required<{ size: object }>;
}

export interface Storable extends BaseEntity {
  storage: number;
  parsers(): AttributeParsers & Required<{ size: Function }>;
  validations(): Validations & Required<{ storage: object }>;
}

export interface Mountable extends BaseEntity {
  volumes: string; // TODO
  parsers(): AttributeParsers & Required<{ volumes: Function }>;
  validations(): Validations & Required<{ volumes: object }>;
}

export interface MultiNode extends BaseEntity {
  nodes: number;
  parsers(): AttributeParsers & Required<{ nodes: Function }>;
  validations(): Validations & Required<{ nodes: object }>;
}

export interface Authenticatable extends BaseEntity {
  credentials: CredentialsObject;
  parsers(): AttributeParsers & Required<{ credentials: Function }>;
  validations(): Validations & Required<{ credentials: object }>;
}

export interface Rootable extends BaseEntity {
  rootCredentials: CredentialsObject;
  parsers(): AttributeParsers & Required<{ rootCredentials: Function }>;
  validations(): Validations & Required<{ rootCredentials: object }>;
}

export interface Versioned extends BaseEntity {
  version: string;
  parsers(): AttributeParsers & Required<{ version: Function }>;
  validations(): Validations & Required<{ version: object }>;
}

export interface Profilable extends BaseEntity {
  profile: string;
  overrides: object;
}

export interface StorageAdapter extends BaseEntity {
  read(): Promise<object>;
  write(contents: object): Promise<void>;
}

export interface ConfigurationResource {
  readonly isWriteable: boolean;
  normalize(contents: object): object;
  read(): void;
  write(): Promise<void>;
}

export interface Vault extends ConfigurationResource {
  credentials(service: string): CredentialsObject;
  rootCredentials(service: string): CredentialsObject;
}

export interface CloudStack extends TerraformStack {
  readonly name: string;
  readonly targetPath: string;
  readonly app: TerraformApp;
  path: string;
  generate(): void;
}
