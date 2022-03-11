import { CloudService } from '@stackmate/interfaces';
import { PROVIDER, SERVICE_TYPE, STORAGE } from '@stackmate/constants';

// Utility types
export type ConstructorOf<T> = Function & { new(...args: any[]): T };
export type FactoryOf<T> = { factory(...args: any[]): T; }
export type AbstractConstructor<T = {}> = abstract new (...args: any[]) => T;
export type ValueOf<T> = T[keyof T];
export type ChoiceOf<T> = T[keyof T];
export type OneOf<T extends ReadonlyArray<unknown>> = T extends ReadonlyArray<infer OneOf> ? OneOf : never;
export type ServiceTypeChoice = ChoiceOf<typeof SERVICE_TYPE>;
export type ProviderChoice = ChoiceOf<typeof PROVIDER>;
export type StorageChoice = ChoiceOf<typeof STORAGE>;
export type ServiceScopeChoice = OneOf<['deployable', 'preparable', 'destroyable']>;

// Config file types
export type ServiceAssociationDeclarations = string[];
export type EnvironmentVariablesDeclaration = Record<string, string | number>;

export type CredentialsObject = {
  username?: string;
  password?: string;
};

export type CredentialsCollection = {
  [service: string]: CredentialsObject;
}

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

export type CloudAttributes = {
  regions: Array<string>;
  defaults?: ProviderDefaults;
};

export type ServiceList = Map<string, CloudService>;

export type RegionList = {
  [name: string]: string;
};

export type ProviderDefaults = {
  [name: string]: string | number;
};

export type AwsDefaults = ProviderDefaults & {
  'vpc-cidr'?: string;
  'vpc-prefix'?: string;
};

export type ProjectDefaults = {
  aws?: AwsDefaults;
};

export type StageConfiguration = {
  [srv: string]: ServiceConfigurationDeclaration;
};

export type StageDeclarations = {
  [name: string]: StageConfiguration & { from?: string; skip?: Array<string> };
};

export type VaultConfiguration = {
  provider?: ProviderChoice;
  key?: string;
  region?: string;
  path?: string;
};

export type StateConfiguration = {
  provider?: ProviderChoice;
  key?: string;
  region?: string;
  bucket?: string;
}

export type ProjectConfiguration = {
  name?: string;
  provider?: string;
  secrets?: VaultConfiguration;
  state?: StateConfiguration;
  region?: string;
  stages?: StageDeclarations;
  defaults?: ProjectDefaults;
};

export type StagesAttributes = {
  [name: string]: {
    [serviceName: string]: ServiceAttributes;
  };
};

export type NormalizedStage = {
  [serviceName: string]: ServiceConfigurationDeclarationNormalized;
}

export type StagesNormalizedAttributes = {
  [name: string]: NormalizedStage;
};

export type NormalizedStages = {
  [name: string]: ServiceConfigurationDeclarationNormalized;
};

export type NormalizedProjectConfiguration = {
  name: string;
  provider: ProviderChoice,
  region: string,
  stages: StagesNormalizedAttributes;
  secrets: VaultConfiguration,
  state: StateConfiguration,
  defaults: ProjectDefaults;
};

export interface AttributeParsers {
  [name: string]: Function;
}

export interface EntityAttributes {
  [name: string]: any;
}

export type Validations = {
  [name: string]: object;
};

export type ValidationErrorList = {
  [attribute: string]: Array<string>;
};

export type StorageOptions = {};
export type LocalFileStorageOptions = StorageOptions & {
  path: string;
};
export type AwsParamStorageOptions = StorageOptions & {
  provider: 'aws';
  key: string;
  region: string;
  namespace: string;
};

export type ConfigurationAttributes = {
  storage: StorageChoice;
  [name: string]: any;
};

export type ResourceProfile = {
  [attribute: string]: object;
};

export type VaultAttributes = ConfigurationAttributes & {
  key?: string;
  region?: string;
};

export type VaultCredentialOptions = {
  length?: number;
  root?: Boolean;
  special?: Boolean;
  exclude?: string[],
};

export type PrepareOperationOptions = {
  statePath: string;
};
