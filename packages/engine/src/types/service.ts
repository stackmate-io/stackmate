import { TerraformProvider } from 'cdktf';

import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';

import { AttributeParsers, BaseEntity, BaseEntityConstructor, Validations } from './entity';
import { CloudStack, CredentialsObject } from './lib';
import { VaultCredentialOptions } from './project';
import { OneOf, ChoiceOf, Diff } from './util';
import { JSONSchemaType } from 'ajv';
import { PartialSchema } from 'ajv/dist/types/json-schema';

export type ProviderChoice = ChoiceOf<typeof PROVIDER>;
export type ServiceTypeChoice = ChoiceOf<typeof SERVICE_TYPE>;
export type ServiceScopeChoice = OneOf<['deployable', 'preparable', 'destroyable']>;
export type ServiceAssociationDeclarations = string[];

export type RegionList = {
  [name: string]: string;
};

export type ServiceAssociation = {
  lookup: (a: CloudService) => boolean;
  handler: (a: CloudService) => void;
};

export type ServiceConfigurationDeclaration = {
  type: ServiceTypeChoice;
  provider?: ProviderChoice;
  region?: string;
  profile?: string;
  links?: ServiceAssociationDeclarations;
};

export type ServiceConfigurationDeclarationNormalized = {
  type: ServiceTypeChoice;
  provider: ProviderChoice;
  region: string;
  name: string;
  projectName: string;
  stageName: string;
  profile?: string;
  links?: ServiceAssociationDeclarations;
};

// The final attributes that the Service class should expect
export type ServiceAttributes = ServiceConfigurationDeclarationNormalized;

export type ServiceList = Map<string, CloudService>;

export interface CloudService extends BaseEntity {
  readonly name: string;
  readonly provider: ProviderChoice;
  readonly type: ServiceTypeChoice;
  region: string;
  links: Array<string>;
  identifier: string;
  providerService: ProviderService;
  vault: VaultService;
  get isRegistered(): boolean;
  link(...targets: CloudService[]): CloudService;
  scope(name: ServiceScopeChoice): CloudService;
  associations(): ServiceAssociation[];
  isDependingUpon(service: CloudService): boolean;
  parsers(): AttributeParsers & Required<{ name: Function, links: Function }>;
  validations(): Validations & Required<{ name: object, links: object }>;
  register(stack: CloudStack): void;
  onPrepare(stack: CloudStack): void;
  onDeploy(stack: CloudStack): void;
  onDestroy(stack: CloudStack): void;
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

export interface VaultService extends CloudService {
  credentials(stack: CloudStack, service: string, opts?: VaultCredentialOptions): CredentialsObject;
}

export interface ProviderService extends CloudService {
  resource: TerraformProvider;
  bootstrap(stack: CloudStack): void;
  prerequisites(stack: CloudStack): void;
}

export interface StateService extends CloudService {
  backend(stack: CloudStack): void;
  resources(stack: CloudStack): void;
}

export interface CloudServiceConstructor extends BaseEntityConstructor<CloudService> {
  schema<T>(): JSONSchemaType<T>;
  partial<T>(): PartialSchema<T>;
}

export interface CloudServiceRegistry {
  items: { [k in ProviderChoice]?: { [s in ServiceTypeChoice]?: CloudServiceConstructor } };
  add(
    classConstructor: CloudServiceConstructor, provider: ProviderChoice, type: ServiceTypeChoice,
  ): void;
  get(provider: ProviderChoice, type: ServiceTypeChoice): CloudServiceConstructor;
}

// Service class types
export interface BaseService {
  name: string;
  profile: string;
  links: string[];
  overrides: object;
}

export interface DatabaseService extends BaseService {
  size: string;
  storage: number;
  version: string;
  database: string;
  nodes: number;
  port: number;
}

export type DiffService = Diff<DatabaseService, BaseService>;
