import {
  ProviderChoice,
  ServiceAttributes,
  ServiceConfigurationDeclaration,
  ServiceConfigurationDeclarationNormalized,
} from './service';

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
};

export type ResourceProfile = {
  [attribute: string]: object;
};

export type VaultCredentialOptions = {
  length?: number;
  root?: Boolean;
  special?: Boolean;
  exclude?: string[],
};
