import { TerraformProvider } from 'cdktf';

import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';

import { BaseEntity, BaseEntityConstructor } from '../entity';
import { CloudStack, CredentialsObject } from '../lib';
import { VaultCredentialOptions } from '../project';
import { OneOf, ChoiceOf, AbstractConstructorOf } from '../util';
import { JsonSchema, BaseServiceSchema, DatabaseServiceSchema, ProviderServiceSchema, StateServiceSchema, VaultServiceSchema } from '../schema';

export type ProviderChoice = ChoiceOf<typeof PROVIDER>;
export type ServiceTypeChoice = ChoiceOf<typeof SERVICE_TYPE>;
export type ServiceScopeChoice = OneOf<['deployable', 'preparable', 'destroyable']>;
export type ServiceAssociationDeclarations = string[];
export type RegionList = { [name: string]: string; };

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

export type ServiceAttributes = {
  type: ServiceTypeChoice;
  provider: ProviderChoice;
  region: string;
  name: string;
  projectName: string;
  stageName: string;
  profile?: string;
  links?: ServiceAssociationDeclarations;
};

export interface CloudService extends BaseEntity, BaseServiceSchema {
  readonly provider: ProviderChoice;
  readonly type: ServiceTypeChoice;
  region: string;
  providerService: ProviderService;
  vault: VaultService;
  identifier: string;
  isRegistered(): boolean;
  link(...targets: CloudService[]): CloudService;
  scope(name: ServiceScopeChoice): CloudService;
  associations(): ServiceAssociation[];
  isDependingUpon(service: CloudService): boolean;
  register(stack: CloudStack): void;
  onPrepare(stack: CloudStack): void;
  onDeploy(stack: CloudStack): void;
  onDestroy(stack: CloudStack): void;
}

export interface CloudServiceConstructor extends BaseEntityConstructor<CloudService> {
  schema<T extends BaseServiceSchema>(): JsonSchema<T>;
  defaults(): { [key: string]: any };
}

export type AbstractCloudServiceConstructor = AbstractConstructorOf<CloudService> & {
  schema<T extends BaseServiceSchema>(): JsonSchema<T>;
}

export interface CloudServiceRegistry {
  items: { [k in ProviderChoice]?: { [s in ServiceTypeChoice]?: CloudServiceConstructor } };
  add(
    classConstructor: CloudServiceConstructor, provider: ProviderChoice, type: ServiceTypeChoice,
  ): void;
  get(provider: ProviderChoice, type: ServiceTypeChoice): CloudServiceConstructor;
}

export interface DatabaseService extends DatabaseServiceSchema { }

export interface VaultService extends CloudService, VaultServiceSchema {
  credentials(stack: CloudStack, service: string, opts?: VaultCredentialOptions): CredentialsObject;
}

export interface ProviderService extends CloudService, ProviderServiceSchema {
  resource: TerraformProvider;
  bootstrap(stack: CloudStack): void;
  prerequisites(stack: CloudStack): void;
}

export interface StateService extends CloudService, StateServiceSchema {
  backend(stack: CloudStack): void;
  resources(stack: CloudStack): void;
}