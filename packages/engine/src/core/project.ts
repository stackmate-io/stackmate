import Entity from '@stackmate/engine/lib/entity';
import { Attribute } from '@stackmate/engine/lib/decorators';
import { normalizeProject } from '@stackmate/engine/lib/normalizers';
import {
  ProjectConfiguration, NormalizedProjectConfiguration, StackmateProject,
  StagesNormalizedAttributes, StateConfiguration,
  VaultConfiguration, ProviderChoice,
} from '@stackmate/engine/types';

class Project extends Entity implements StackmateProject {
  /**
   * @var {String} name the project's name
   */
  @Attribute name: string;

  /**
   * @var {String} provider the default cloud provider for the project
   */
  @Attribute provider: ProviderChoice;

  /**
   * @var {String} region the default cloud region for the project
   */
  @Attribute region: string;

  /**
   * @var {VaultConfiguration} secrets the vault configuration
   */
  @Attribute secrets: VaultConfiguration = {};

  /**
   * @var {StateConfiguration} state the state configuration
   */
  @Attribute state: StateConfiguration = {};

  /**
   * @var {Object} stages the stages declarations
   */
  @Attribute stages: StagesNormalizedAttributes = {};

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
