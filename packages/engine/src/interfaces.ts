import { Construct } from 'constructs';
import { App as TerraformApp } from 'cdktf';

import {
  ProviderChoice, RegionList, ServiceAttributes, ServiceAssociation,
  ServiceMapping, ServiceTypeChoice, CloudPrerequisites, Validations,
  AttributeParsers, StorageChoice, NormalizedProjectConfiguration, CredentialsObject,
} from '@stackmate/types';

export interface CloudProvider {
  readonly provider: ProviderChoice;
  readonly regions: RegionList;
  readonly serviceMapping: ServiceMapping;
  init(): void;
  service(type: ServiceTypeChoice): CloudService;
}

export interface CloudService {
  readonly name: string;
  readonly provider: ProviderChoice;
  readonly type: ServiceTypeChoice;
  readonly associations: Array<ServiceAssociation>;
  links: Array<string>;
  stage: string;
  region: string;
  dependencies: CloudPrerequisites;
  link(target: CloudService): void;
  provision(): void;
  populate(attributes: ServiceAttributes): CloudService;
}

export interface Validatable {
  validate(attrs: object): void;
  validations(): Validations;
}

export interface AttributesAssignable {
  assignableAttributes(): AttributeParsers;
}

export interface Sizeable extends Validatable, AttributesAssignable {
  size: string;
  validations(): Required<{ size: object }>;
  assignableAttributes(): Required<{ size: Function }>;
}

export interface Storable extends Validatable, AttributesAssignable {
  storage: number;
  validations(): Required<{ storage: object }>;
  assignableAttributes(): Required<{ storage: Function }>;
}

export interface Mountable extends Validatable, AttributesAssignable {
  volumes: string; // TODO
  valdations(): Required<{ volumes: object }>;
  assignableAttributes(): Required<{ volumes: Function }>;
}

export interface MultiNode extends Validatable, AttributesAssignable {
  nodes: number;
  valdations(): Required<{ nodes: object }>;
  assignableAttributes(): Required<{ nodes: Function }>;
}

export interface Authenticatable extends Validatable, AttributesAssignable {
  credentials: CredentialsObject;
  validations(): Required<{ credentials: object }>;
  assignableAttributes(): Required<{ credentials: Function }>;
}

export interface Rootable extends Validatable, AttributesAssignable {
  rootCredentials: CredentialsObject;
  validations(): Required<{ rootCredentials: object }>;
  assignableAttributes(): Required<{ rootCredentials: Function }>;
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
  credentials(service: string): Credentials;
  rootCredentials(service: string): Credentials;
};

export interface CloudStack extends Construct {
  readonly name: string;
  readonly targetPath: string;
  readonly app: TerraformApp;
  path: string;
  synthesize(): void;
};
