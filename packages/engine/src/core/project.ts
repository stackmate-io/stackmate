import { Memoize } from 'typescript-memoize';

import Entity from '@stackmate/lib/entity';
import Parser from '@stackmate/lib/parsers';
import { Attribute } from '@stackmate/lib/decorators';
import { normalizeProject } from '@stackmate/lib/normalizers';
import { StorageAdapter } from '@stackmate/interfaces';
import { getStoragAdaptereByType } from '@stackmate/core/storage';
import { PROVIDER, STORAGE, FORMAT } from '@stackmate/constants';
import {
  ProjectConfiguration, NormalizedProjectConfiguration, ProjectDefaults, Validations,
  AttributeParsers, VaultConfiguration, ProviderChoice, StagesNormalizedAttributes,
} from '@stackmate/types';

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
   * @var {Object} vault the valult configuration
   */
  @Attribute secrets: VaultConfiguration = {};

  /**
   * @var {Object} stages the stages declarations
   */
  @Attribute stages: StagesNormalizedAttributes = {};

  /**
   * @var {Object} defaults the project's defaults
   */
  @Attribute defaults: ProjectDefaults = {};

  /**
   * @var {String} validationMessage the error message
   */
  readonly validationMessage: string = 'The project’s configuration file is not valid';

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
      defaults: {
        validateProjectDefaults: {},
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

  /**
  * @returns {StorageAdapter} storageAdapter the storage adapter to fetch & push values
  */
  @Memoize() public get storage(): StorageAdapter {
    return getStoragAdaptereByType(STORAGE.FILE, { path: this.path, format: FORMAT.YML });
  }

  /**
   * Loads and validates the project
   *
   * @param {String} fileName the file name to load the project from
   * @returns {Project} the project loaded and validated
   * @async
   */
  static async load(fileName: string): Promise<Project> {
    const project = new Project(fileName);
    const attributes = await project.storage.read();

    return Project.factory(attributes);
  }
}

export default Project;
