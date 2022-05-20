import Entity from '@stackmate/engine/lib/entity';
import { normalizeProject } from '@stackmate/engine/lib/normalizers';
import {
  ProjectConfiguration, NormalizedProjectConfiguration, StackmateProject,
  StagesNormalizedAttributes, StateConfiguration,
  VaultConfiguration, ProviderChoice, Attribute,
} from '@stackmate/engine/types';

class Project extends Entity implements StackmateProject {
  /**
   * @var {String} name the project's name
   */
  name: Attribute<string>;

  /**
   * @var {String} provider the default cloud provider for the project
   */
  provider: Attribute<ProviderChoice>;

  /**
   * @var {String} region the default cloud region for the project
   */
  region: Attribute<string>;

  /**
   * @var {VaultConfiguration} secrets the vault configuration
   */
  secrets: Attribute<VaultConfiguration> = {};

  /**
   * @var {StateConfiguration} state the state configuration
   */
  state: Attribute<StateConfiguration> = {};

  /**
   * @var {Object} stages the stages declarations
   */
  stages: Attribute<StagesNormalizedAttributes> = {};

  /**
   * Applies arguments in stage services that were skipped for brevity
   *
   * @param {Object} configuration the file contents that are to be normalized
   * @returns {Object} the normalized contents
   */
  static normalize(configuration: ProjectConfiguration): NormalizedProjectConfiguration {
    return normalizeProject(configuration);
  }
}

export default Project;
