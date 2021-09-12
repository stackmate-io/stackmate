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
  provider: ProviderChoice;
  type: ServiceTypeChoice;
}

export type ServiceAttributes = {
  name: string;
  region: string;
  links?: ServiceAssociationDeclarations;
};

export type ServiceDeclaration = ServiceBaseAttributes & ServiceAttributes;

export type ServiceList = Map<string, CloudService>;

export type ServiceMapping = Map<ServiceTypeChoice, ConstructorOf<CloudService>>;

export type RegionList = { [name: string]: string };

export type CloudPrerequisites = { [name: string]: CloudService };

export type AwsDefaults = {
  'vpc-cidr'?: string;
  'vpc-prefix'?: string;
};

export type ConfigurationFileContents = {
  provider?: string;
  region?: string;
  stages?: {
    [name: string]: {
      from?: string;
      skip?: Array<string>;
      provider?: string;
      region?: string;
    };
  };
  defaults?: {
    aws?: AwsDefaults;
  };
};

export type Validations = {
  [name: string]: object;
};
