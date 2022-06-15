import { JsonSchema } from '@stackmate/engine/types/schema';
import { Attribute, AttributesOf, BaseEntity, NonAttributesOf } from '@stackmate/engine/types/entity';
import {
  BaseService,
  BaseServices,
  CloudProviderChoice,
  CloudServiceAttributes,
  CloudServiceConfiguration,
  CoreServiceConfiguration,
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

export interface ProjectEntity extends BaseEntity {
  name: Attribute<string>;
  provider: Attribute<CloudProviderChoice>;
  region: Attribute<string>;
  secrets: Attribute<BaseServices.Vault.Attributes>;
  state: Attribute<BaseServices.State.Attributes>;
  stages: Attribute<StagesConfiguration>;
  stage(name: string): BaseService.Type[];
}

export namespace StackmateProject {
  export type Attributes = AttributesOf<ProjectEntity>;
  export type Type = Attributes & NonAttributesOf<ProjectEntity>;
  export type Schema = JsonSchema<Attributes>;
}
