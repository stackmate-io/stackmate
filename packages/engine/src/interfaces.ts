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

export interface Deployable extends BaseEntity {
  stack: CloudStack;
  identifier: string;
  isRegistered: boolean;
  register(): void;
  link(target: CloudService): void;
}

export interface CloudProvider extends BaseEntity {
  stack: CloudStack;
  readonly provider: ProviderChoice;
  readonly regions: RegionList;
  readonly serviceMapping: ServiceMapping;
  provision(): void;
  prerequisites(): CloudPrerequisites;
  validations(): Validations & Required<{ regions: object }>;
  introduce(attributes: Omit<ServiceAttributes, 'provider'>): CloudService;
}

export interface CloudService extends Deployable {
  readonly name: string;
  readonly provider: ProviderChoice;
  readonly type: ServiceTypeChoice;
  readonly associations: Array<ServiceAssociation>;
  links: Array<string>;
  region: string;
  parsers(): AttributeParsers & Required<{ name: Function, region: Function, links: Function }>;
  validations(): Validations & Required<{ name: object, region: object, links: object }>;
}

export interface CreatableDeployable extends Deployable {
  create(): void;
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

export interface EntityConstructor extends BaseEntity {
  new(...args: any[]): BaseEntity;
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

export interface StorageAdapter {
  deserialize(serialized: string | object): object;
  read(): Promise<object>;
}

export interface CloudStack extends TerraformStack {
  readonly name: string;
  readonly app: TerraformApp;
  readonly appName: string;
  readonly outputPath: string;
}

export interface CloudApp extends TerraformApp {
  readonly name: string;
  stack(name: string): CloudStack;
}

export interface ProjectStage extends Omit<Deployable, 'link' | 'isRegistered' | 'register'> {
  initialize(): void;
}

export interface VaultService extends Deployable {}
