import { JsonSchema } from '@stackmate/engine/types/schema';
import { RequireKeys } from '@stackmate/engine/types/util';
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

type BaseStageConfiguration = {
  name: string;
  services?: CloudServiceConfiguration<CloudServiceAttributes>[],
  copy?: string;
  skip?: string[];
};

export type StageConfiguration = RequireKeys<BaseStageConfiguration, 'name' | 'services'> | RequireKeys<BaseStageConfiguration, 'name' | 'copy'>;

export type ProjectConfiguration = {
  name: string;
  provider: CloudProviderChoice;
  region: string;
  state?: CoreServiceConfiguration<StateServiceAttributes>;
  secrets?: CoreServiceConfiguration<VaultServiceAttributes>;
  stages: StageConfiguration[];
};

export interface ProjectEntity extends BaseEntity {
  name: Attribute<string>;
  provider: Attribute<CloudProviderChoice>;
  region: Attribute<string>;
  secrets: Attribute<BaseServices.Vault.Attributes>;
  state: Attribute<BaseServices.State.Attributes>;
  stages: Attribute<StageConfiguration[]>;
  stage(name: string): BaseService.Type[];
}

export namespace StackmateProject {
  export type Attributes = AttributesOf<ProjectEntity>;
  export type Type = Attributes & NonAttributesOf<ProjectEntity>;
  export type Schema = JsonSchema<Attributes>;
}
