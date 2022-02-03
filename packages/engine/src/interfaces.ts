import { App as TerraformApp, ITerraformResource, TerraformStack } from 'cdktf';

import {
  ProviderChoice, RegionList, ServiceAssociation, AttributeParsers,
  ServiceTypeChoice, CloudPrerequisites, Validations, EntityAttributes, ConstructorOf,
} from '@stackmate/types';

export interface BaseEntity {
  validationMessage: string;
  attributes: EntityAttributes;
  parsers(): AttributeParsers;
  validate(): void;
  validations(): Validations;
  getAttribute(name: string): any;
  setAttribute(name: string, value: any): void;
}

export interface Deployable extends BaseEntity {
  identifier: string;
  isRegistered: boolean;
  link(target: CloudService): void;
  provision(stack: CloudStack, vault?: VaultService, providerAlias?: string): void;
}

export interface CloudProvider extends BaseEntity {
  readonly provider: ProviderChoice;
  readonly regions: RegionList;
  readonly aliases: Map<string, string | undefined>;
  prerequisites(): CloudPrerequisites;
  provision(stack: CloudStack, vault?: VaultService): void;
  validations(): Validations & Required<{ regions: object }>;
}

export interface CloudService extends BaseEntity {
  readonly name: string;
  readonly provider: ProviderChoice;
  readonly type: ServiceTypeChoice;
  readonly associations: Array<ServiceAssociation>;
  region: string;
  links: Array<string>;
  providerAlias?: string;
  parsers(): AttributeParsers & Required<{ name: Function, region: Function, links: Function }>;
  validations(): Validations & Required<{ name: object, region: object, links: object }>;
}

export interface BaseEntityConstructor<T extends BaseEntity> extends Function {
  prototype: T;
  new(...args: any[]): T;
  factory(this: ConstructorOf<T>, ...args: any[]): T;
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

export interface ProjectStage extends BaseEntity {
  stack: CloudStack;
  vault: VaultService;
}

export interface CredentialsResource extends ITerraformResource {}

export interface CredentialsProvider {
  username: CredentialsResource;
  password: CredentialsResource;
}

export interface VaultService extends BaseEntity {
  stack: CloudStack;
  for(service: string, opts?: { root: boolean }): CredentialsProvider;
}

export interface CloudProvisioner {
  addCloud(cloud: CloudProvider): void;
  get(provider: ProviderChoice): CloudProvider;
  forEach(callback: (c: CloudProvider) => void): void;
  alias(provider: ProviderChoice, region: string): string | undefined;
  provision(s: CloudStack, srv: CloudService[], obj?: { vault?: VaultService, state?: object /** @todo */ }): void;
}

export interface SubclassRegistry<T> {
  items: Map<string, T>;
  add(classConstructor: T, ...attrs: string[]): void;
  get(...attrs: string[]): T | undefined;
}
