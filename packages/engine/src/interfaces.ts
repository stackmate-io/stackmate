import { App as TerraformApp, TerraformProvider, TerraformStack } from 'cdktf';

import {
  ProviderChoice, ServiceAssociation, AttributeParsers,
  ServiceScopeChoice, AbstractConstructor, ConstructorOf,
  ServiceTypeChoice, Validations, EntityAttributes,
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

export interface CloudService extends BaseEntity {
  readonly name: string;
  readonly provider: ProviderChoice;
  readonly type: ServiceTypeChoice;
  region: string;
  links: Array<string>;
  identifier: string;
  get isRegistered(): boolean;
  link(target: CloudService): void;
  associations(): ServiceAssociation[];
  isAssociatedWith(service: CloudService): boolean;
  parsers(): AttributeParsers & Required<{ name: Function, links: Function }>;
  validations(): Validations & Required<{ name: object, links: object }>;
  register(stack: CloudStack): void;
  scope(name: ServiceScopeChoice): CloudService;
  onPrepare(stack: CloudStack): void;
  onDeploy(stack: CloudStack): void;
  onDestroy(stack: CloudStack): void;
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

export interface VaultService extends CloudService {
  username(service: string, root: boolean): string;
  password(service: string): string;
}

export interface ProviderService extends CloudService {
  resource: TerraformProvider;
}

export interface SubclassRegistry<T> {
  items: Map<string, T>;
  get(attributes: object): T | undefined;
  add(classConstructor: T, ...attrs: string[]): void;
}

export interface CloudServiceConstructor extends AbstractConstructor<CloudService> {}
