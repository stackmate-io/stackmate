import Entity from '@stackmate/engine/lib/entity';
import Parser from '@stackmate/engine/lib/parsers';
import { PROVIDER } from '@stackmate/engine/constants';
import { Attribute } from '@stackmate/engine/lib/decorators';
import { normalizeProject } from '@stackmate/engine/lib/normalizers';
import {
  ProjectConfiguration, NormalizedProjectConfiguration,
  StagesNormalizedAttributes, Validations, StateConfiguration,
  AttributeParsers, VaultConfiguration, ProviderChoice,
} from '@stackmate/engine/types';

class Project extends Entity {
  /**
   * @var {String} name the project's name
   */
  @Attribute name: string

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
   * @var {String} validationMessage the error message
   */
  readonly validationMessage: string = 'The project’s configuration is not valid';

  /**
   * @var {String} path the path to the file
   */
  public readonly path: string;

  /**
   * @constructor
   * @param {String} path the project's file path
   * @param {String} targetPath the output path for the stack
   */
  constructor(path: string) {
    super();

    this.path = path;
  }

  /**
   * Returns a list of validations to validate the structure of the configuration file with
   *
   * @returns {Validations} the list of validations to use for the config file
   */
  validations(): Validations {
    const providers = Object.values(PROVIDER);

    return {
      name: {
        presence: {
          allowEmpty: false,
          message: 'You have to provide a name for the project',
        },
        format: {
          pattern: '[a-z0-9-_./]+',
          flags: 'i',
          message: 'The project name needs to be in URL-friendly format, same as the repository name',
        },
      },
      provider: {
        presence: {
          message: 'A default cloud provider should be specified',
        },
        inclusion: {
          within: providers,
          message: `The default cloud provider is invalid. Available options are ${providers.join(', ')}`,
        },
      },
      region: {
        presence: {
          message: 'A default region (that corresponds to the regions that the default cloud provider provides) should be specified',
        },
      },
      secrets: {
        validateSecrets: {},
      },
      stages: {
        validateStages: {},
      },
      state: {
        validateState: {},
      },
    };
  }

  /**
   * @returns {AttributeParsers} the functions to parse the attributes with
   */
  parsers(): AttributeParsers {
    return {
      name: Parser.parseString,
      region: Parser.parseString,
      provider: Parser.parseString,
      secrets: Parser.parseObject,
      state: Parser.parseObject,
      stages: Parser.parseObject,
      defaults: Parser.parseObject,
    };
  }

  /**
   * Applies arguments in stage services that were skipped for brevity
   *
   * @param {Object} configuration the file contents that are to be normalized
   * @returns {Object} the normalized contents
   */
  normalize(configuration: ProjectConfiguration): NormalizedProjectConfiguration {
    return normalizeProject(configuration);
  }
}

export default Project;
