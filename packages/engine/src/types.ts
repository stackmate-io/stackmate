import { CloudService } from 'interfaces';
import { PROVIDER, SERVICE_TYPE } from 'core/constants';

// Generic types
export type ConstructorOf<T> = { new(...args: any[]): T };
export type ValueOf<T> = T[keyof T];
export type ChoiceOf<T> = T[keyof T];
export type ServiceTypeChoice = ChoiceOf<typeof SERVICE_TYPE>;
export type ProviderChoice = ChoiceOf<typeof PROVIDER>;

// Config file types
export type ServiceAssociationDeclarations = Array<string>;
export type EnvironmentVariablesDeclaration = Record<string, string|number>;

export type ServiceAssociation = {
  lookup: ConstructorOf<CloudService>;
  handler: (a: CloudService) => void;
};

export type ServiceBaseAttributes = {
  name: string;
  provider: ProviderChoice;
  type: ServiceTypeChoice;
  region: string;
}

export type ServiceAttributes = {
  links?: ServiceAssociationDeclarations;
};

export type ServiceDeclaration = ServiceBaseAttributes & ServiceAttributes;

export type ServiceList = Map<string, CloudService>;

export type ServiceMapping = Map<ServiceTypeChoice, ConstructorOf<CloudService>>;

export type RegionList = { [name: string]: string };

export type CloudPrerequisites = { [name: string]: CloudService };
