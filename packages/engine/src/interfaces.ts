import { App as TerraformApp, TerraformStack } from 'cdktf';

import {
  ProviderChoice, RegionList, ServiceAttributes, ServiceAssociation,
  ServiceMapping, ServiceTypeChoice, CloudPrerequisites, Validations,
  StorageChoice, NormalizedProjectConfiguration, CredentialsObject,
} from '@stackmate/types';

export interface CloudProvider {
  readonly provider: ProviderChoice;
  readonly regions: RegionList;
  readonly serviceMapping: ServiceMapping;
  init(): void;
  service(type: ServiceTypeChoice): CloudService;
}

export interface Provisionable {
  isProvisioned: boolean;
  provision(): void;
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
  populate(attributes: ServiceAttributes): CloudService;
}

export interface Validatable {
  validate(attrs: object): void;
  validations(): Validations;
}

export interface AttributesParseable {
  parseAttributes(attributes: object): ServiceAttributes;
}

export interface Sizeable extends Validatable, AttributesParseable {
  size: string;
  readonly defaultSize: string;
  validations(): Validations & Required<{ size: object }>;
  parseAttributes(attributes: object): ServiceAttributes & Required<{ size: string }>;
}

export interface Storable extends Validatable, AttributesParseable {
  storage: number;
  validations(): Validations & Required<{ storage: object }>;
  parseAttributes(attributes: object): ServiceAttributes & Required<{ storage: number }>;
}

export interface Mountable extends Validatable, AttributesParseable {
  volumes: string; // TODO
  validations(): Validations & Required<{ volumes: object }>;
  parseAttributes(attributes: object): ServiceAttributes & Required<{ volumes: string }>;
}

export interface MultiNode extends Validatable, AttributesParseable {
  nodes: number;
  validations(): Validations & Required<{ nodes: object }>;
  parseAttributes(attributes: object): ServiceAttributes & Required<{ nodes: number }>;
}

export interface Authenticatable extends Validatable, AttributesParseable {
  credentials: CredentialsObject;
  validations(): Validations & Required<{ credentials: object }>;
  parseAttributes(attributes: object): ServiceAttributes & Required<{ credentials: CredentialsObject }>;
}

export interface Rootable extends Validatable, AttributesParseable {
  rootCredentials: CredentialsObject;
  validations(): Validations & Required<{ rootCredentials: object }>;
  parseAttributes(attributes: object): ServiceAttributes & Required<{ rootCredentials: CredentialsObject }>;
}

export interface Versioned extends Validatable, AttributesParseable {
  version: string;
  validations(): Validations & Required<{ version: object }>;
  parseAttributes(attributes: object): ServiceAttributes & Required<{ version: string }>;
}

export interface Profilable {
  profile: string;
  overrides: object;
}

export interface StorageAdapter {
  read(): Promise<string | object>;
  write(contents: string | object): Promise<void>;
}

export interface Formatter {
  parse(raw: string|object): Promise<object>;
  export(parsed: object): Promise<string|object>;
}

export interface ConfigurationResource {
  storage: StorageChoice;
  contents: object;
  readonly isWriteable: boolean;
  load(): Promise<object>;
  normalize(contents: object): object;
  write(): Promise<void>;
}

export interface Project extends ConfigurationResource {
  outputPath: string;
  contents: NormalizedProjectConfiguration;
}

export interface Vault extends ConfigurationResource {
  credentials(service: string): CredentialsObject;
  rootCredentials(service: string): CredentialsObject;
};

export interface CloudStack extends TerraformStack {
  readonly name: string;
  readonly targetPath: string;
  readonly app: TerraformApp;
  path: string;
  synthesize(): void;
};
