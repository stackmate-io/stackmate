import { CloudService } from '@stackmate/interfaces';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/core/constants';

// Generic types
export type ConstructorOf<T> = { new(...args: any[]): T };
export type ValueOf<T> = T[keyof T];
export type ChoiceOf<T> = T[keyof T];
export type ServiceTypeChoice = ChoiceOf<typeof SERVICE_TYPE>;
export type ProviderChoice = ChoiceOf<typeof PROVIDER>;

// Config file types
export type ServiceAssociationDeclarations = Set<string>;
export type EnvironmentVariablesDeclaration = Record<string, string|number>;

export type ServiceAssociation = {
  lookup: ConstructorOf<CloudService>;
  handler: (a: CloudService) => void;
};

export type ServiceBaseAttributes = {
  type: ServiceTypeChoice;
  links?: ServiceAssociationDeclarations;
}

// Service declaration, as it should be appeared in the configuration file
export type ServiceDeclaration = {
  provider?: ProviderChoice;
  region?: string;
} & ServiceBaseAttributes;

// Service attributes after they have been normalized
export type ServiceAttributes = {
  provider: ProviderChoice;
  region: string;
  name: string;
} & ServiceBaseAttributes;

export type ServiceList = Map<string, CloudService>;

export type ServiceMapping = Map<ServiceTypeChoice, ConstructorOf<CloudService>>;

export type RegionList = { [name: string]: string };

export type CloudPrerequisites = { [name: string]: CloudService };

export type ProviderDefaults = {
  [name: string]: string | number;
}

export type AwsDefaults = {
  'vpc-cidr'?: string;
  'vpc-prefix'?: string;
};

export type ProjectDefaults = {
  aws?: AwsDefaults;
};

export type StageDeclarations = {
  [name: string]: { from?: string; skip?: Array<string> } & {
    [srv: string]: ServiceDeclaration;
  };
}

export type ConfigurationFileContents = {
  name?: string;
  provider?: string;
  region?: string;
  stages?: StageDeclarations;
  defaults?: ProjectDefaults;
};

export type StagesAttributes = {
  [name: string]: {
    [serviceName: string]: ServiceAttributes;
  };
};

export type NormalizedFileContents = {
  name: string;
  stages: StagesAttributes;
  defaults: ProjectDefaults;
};

export type Validations = {
  [name: string]: object;
};
