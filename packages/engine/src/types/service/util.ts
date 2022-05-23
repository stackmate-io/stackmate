import { BaseJsonSchema } from '@stackmate/engine/types/schema';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import { AbstractConstructorOf, ChoiceOf, OneOf } from '@stackmate/engine/types/util';
import { BaseEntityConstructor } from '@stackmate/engine/types/entity';
import { BaseService } from '@stackmate/engine/types/service/base';

export type ProviderChoice = ChoiceOf<typeof PROVIDER>;
export type ServiceTypeChoice = ChoiceOf<typeof SERVICE_TYPE>;
export type ServiceScopeChoice = OneOf<['deployable', 'preparable', 'destroyable']>;
export type ServiceAssociationDeclarations = string[];
export type RegionList = { [name: string]: string; };

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

export interface ServiceConstructor extends BaseEntityConstructor<BaseService.Type> {
  schema(): BaseJsonSchema;
  defaults(): { [key: string]: any };
}

export type AbstractServiceConstructor = AbstractConstructorOf<BaseService.Type> & {
  schema(): BaseJsonSchema;
}

export type ServiceAssociations = {
  [key: string]: [Function]
};
