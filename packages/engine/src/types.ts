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

/*
- name: django-app-mysql-db
  type: mysql
  version: 5.7
  size: db.t3.micro
  storage: 100
  databases:
    - djangoapp
*/

export type ServiceAttributes = {
  associations?: ServiceAssociationDeclarations;
};

export type ServiceAssociation = {
  lookup: ConstructorOf<CloudService>;
  onRegister: (a: Array<CloudService>) => void;
};

export type ServiceDeclaration = {
  name: string;
  provider: ProviderChoice;
  type: ServiceTypeChoice;
  region: string;
} & ServiceAttributes;

export type ServiceList = Map<string, CloudService>;
export type ServiceMapping = Map<ServiceTypeChoice, ConstructorOf<CloudService>>;
export type RegionList = { [name: string]: string };
