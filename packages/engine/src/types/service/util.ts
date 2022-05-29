import { BaseService } from '@stackmate/engine/types/service/base';
import { CLOUD_PROVIDER, PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import { AbstractConstructorOf, ChoiceOf, OneOf, RequireKeys } from '@stackmate/engine/types/util';
import { BaseEntityConstructor } from '@stackmate/engine/types/entity';

export type ProviderChoice = ChoiceOf<typeof PROVIDER>;
export type CloudProviderChoice = ChoiceOf<typeof CLOUD_PROVIDER>;
export type ServiceTypeChoice = ChoiceOf<typeof SERVICE_TYPE>;
export type ServiceScopeChoice = OneOf<['deployable', 'preparable', 'destroyable']>;
export type ServiceAssociationDeclarations = string[];
export type RegionList = { [name: string]: string; };
export type ResourceProfile = { [attribute: string]: object; };

export type VaultCredentialOptions = {
  length?: number;
  root?: Boolean;
  special?: Boolean;
  exclude?: string[],
};

// For the cloud services that are available in the stages configuration,
// the minimal requirement would be the name and type
export type CloudServiceConfiguration<T extends BaseService.Attributes> = RequireKeys<Partial<T>, 'name' | 'type'>;

// For the required services (eg. state & vault) configuration, the configuration
// should skip all of the base class's attributes **except** the provider,
// but provide all of the service's keys as optional
export type CoreServiceConfiguration<T extends BaseService.Attributes> = Partial<T> & Pick<T, 'provider'>;
export type ConfigurationOptions<T extends BaseService.Attributes> = CloudServiceConfiguration<T> | CoreServiceConfiguration<T>;

export interface ServiceConstructor extends BaseEntityConstructor<BaseService.Type> {
  config(opts?: { projectName?: string; stageName?: string }): Partial<BaseService.Attributes>;
}

export type AbstractServiceConstructor = AbstractConstructorOf<BaseService.Type>;
export type ServiceAssociations = { [key: string]: [Function] };
