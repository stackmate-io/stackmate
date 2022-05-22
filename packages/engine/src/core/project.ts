import Entity from '@stackmate/engine/lib/entity';
import { normalizeProject } from '@stackmate/engine/lib/normalizers';
import {
  ProjectConfiguration, NormalizedProjectConfiguration, ProviderChoice,
  StagesNormalizedAttributes, StateConfiguration, VaultConfiguration,
  Project as StackmateProject
} from '@stackmate/engine/types';

class Project extends Entity<StackmateProject.Attributes> implements StackmateProject.Type {
  /**
   * @var {String} name the project's name
   */
  name: string;

  /**
   * @var {String} provider the default cloud provider for the project
   */
  provider: ProviderChoice;

  /**
   * @var {String} region the default cloud region for the project
   */
  region: string;

  /**
   * @var {VaultConfiguration} secrets the vault configuration
   */
  secrets: VaultConfiguration = {};

  /**
   * @var {StateConfiguration} state the state configuration
   */
  state: StateConfiguration = {};

  /**
   * @var {Object} stages the stages declarations
   */
  stages: StagesNormalizedAttributes = {};

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
