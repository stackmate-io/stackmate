import { JsonSchema } from '@stackmate/engine/types/schema';
import { Attribute, AttributesOf, BaseEntity, NonAttributesOf } from '@stackmate/engine/types/entity';
import {
  BaseService,
  BaseServices,
  CloudProviderChoice,
  CloudServiceAttributes,
  CloudServiceConfiguration,
  CoreServiceConfiguration,
  ServiceTypeChoice,
  StateServiceAttributes,
  VaultServiceAttributes,
} from '@stackmate/engine/types/service';

export type StageCopy = { copy?: string, skip?: string[] };
export type StageConfiguration = {
  [service: string]: CloudServiceConfiguration<CloudServiceAttributes>;
};
export type StagesConfiguration = {
  [stage: string]: StageConfiguration & StageCopy | StageCopy;
};
export type ProjectConfiguration = {
  name: string;
  provider: CloudProviderChoice;
  region: string;
  state?: CoreServiceConfiguration<StateServiceAttributes>;
  secrets?: CoreServiceConfiguration<VaultServiceAttributes>;
  stages: StagesConfiguration;
};


const p: ProjectConfiguration = {
  name: 'omg',
  provider: 'aws',
  region: 'eu-central-1',
  state: {
    provider: 'local',
  },
  stages: {
    production: {
      database: {
        name: 'omg',
        type: 'mariadb',
        database: 'omg',
        profile: 'default'
      },
    },
    staging: {
      copy: 'production',
      skip: ['database'],
    }
  }
}


export interface ProjectEntity extends BaseEntity {
  name: Attribute<string>;
  provider: Attribute<CloudProviderChoice>;
  region: Attribute<string>;
  secrets: Attribute<BaseServices.Vault.Attributes>;
  state: Attribute<BaseServices.State.Attributes>;
  stages: Attribute<StagesConfiguration>;
  stage(name: string): BaseService.Type[];
}

export namespace Project {
  export type Attributes = AttributesOf<ProjectEntity>;
  export type Type = Attributes & NonAttributesOf<ProjectEntity>;
  export type Schema = JsonSchema<Attributes>;
}

// Options to provide when creating a project
export type ProjectConfigCreationOptions = {
  projectName?: string,
  defaultProvider?: CloudProviderChoice,
  defaultRegion?: string,
  stageNames?: string[],
  stateProvider?: CloudProviderChoice,
  secretsProvider?: CloudProviderChoice,
  serviceTypes?: ServiceTypeChoice[],
};
