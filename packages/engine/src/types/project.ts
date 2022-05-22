import { Attribute, AttributesOf, BaseEntity, NonAttributesOf } from '@stackmate/engine/types/entity';
import { JsonSchema } from '@stackmate/engine/types/schema';
import {
  ProviderChoice,
  ServiceAttributes,
  ServiceConfigurationDeclaration,
  ServiceTypeChoice,
} from '@stackmate/engine/types/service';

export type StageConfiguration = {
  [srv: string]: ServiceConfigurationDeclaration;
};

export type StageCopy = {
  from?: string;
  skip?: Array<string>;
}

export type StageDeclarations = {
  [name: string]: StageConfiguration | StageConfiguration & StageCopy | StageCopy;
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
};

export type StagesAttributes = {
  [name: string]: {
    [serviceName: string]: ServiceAttributes;
  };
};

export type NormalizedStage = {
  [serviceName: string]: ServiceAttributes;
}

export type StagesNormalizedAttributes = {
  [name: string]: NormalizedStage;
};

export type NormalizedStages = {
  [name: string]: ServiceAttributes;
};

export type NormalizedProjectConfiguration = {
  name: string;
  provider: ProviderChoice,
  region: string,
  stages: StagesNormalizedAttributes;
  secrets: VaultConfiguration,
  state: StateConfiguration,
};

export type ResourceProfile = {
  [attribute: string]: object;
};

export type ProjectConfigOptions = {
  name: string,
  defaultProvider?: ProviderChoice,
  defaultRegion?: string,
  stageNames?: string[],
  stateProvider?: ProviderChoice,
  secretsProvider?: ProviderChoice,
  serviceTypes?: ServiceTypeChoice[],
};

export type VaultCredentialOptions = {
  length?: number;
  root?: Boolean;
  special?: Boolean;
  exclude?: string[],
};

export interface ProjectEntity extends BaseEntity {
  name: Attribute<string>;
  provider: Attribute<ProviderChoice>;
  region: Attribute<string>;
  secrets: Attribute<VaultConfiguration>;
  state: Attribute<StateConfiguration>;
  stages: Attribute<StagesNormalizedAttributes>;
}

export namespace Project {
  export type Attributes = AttributesOf<ProjectEntity>;
  export type Type = Attributes & NonAttributesOf<ProjectEntity>;
  export type Schema = JsonSchema<Attributes>;
}
