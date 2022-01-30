import { get } from 'lodash';
import { Memoize } from 'typescript-memoize';

import Entity from '@stackmate/lib/entity';
import App from '@stackmate/lib/terraform/app';
import Stage from '@stackmate/core/stage';
import { Attribute } from '@stackmate/lib/decorators';
import { normalizeProject } from '@stackmate/lib/normalizers';
import { StorageAdapter } from '@stackmate/interfaces';
import { getStoragAdaptereByType } from '@stackmate/storage';
import { getVaultByProvider } from '@stackmate/vault';
import { parseObject, parseString } from '@stackmate/lib/parsers';
import { PROVIDER, STORAGE, FORMAT, VAULT_PROVIDER } from '@stackmate/constants';
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
  @Attribute secrets: VaultConfiguration = { provider: VAULT_PROVIDER.AWS };

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
   * @var {Stage} activeStage the stage that is currently selected
   */
  protected activeStage: Stage;

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
      name: parseString,
      region: parseString,
      provider: parseString,
      secrets: parseObject,
      stages: parseObject,
      defaults: parseObject,
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
  * @var {StorageAdapter} storageAdapter the storage adapter to fetch & push values
  */
  @Memoize() public get storage(): StorageAdapter {
    return getStoragAdaptereByType(STORAGE.FILE, { path: this.path, format: FORMAT.YML });
  }

  /**
   * @returns {App} the application to deploy
   */
  @Memoize() public get app(): App {
    return new App(this.name);
  }

  /**
   * @returns {Stage} the currently selectd stage
   */
  public get stage() : Stage {
    if (!this.activeStage) {
      throw new Error('You have to select a stage first');
    }

    return this.activeStage;
  }

  /**
   * Selects a workspace to be deployed
   *
   * @param {String} stage the workspace's name
   */
  select(stage: string) {
    const { provider = VAULT_PROVIDER.AWS, ...vaultAttributes } = this.secrets;

    const stack = this.app.stack(stage);
    const vault = getVaultByProvider(stack, provider, vaultAttributes);

    const attributes = {
      name: stage,
      services: get(this.stages, stage, {}),
      defaults: this.defaults,
    };

    this.activeStage = Stage.factory(attributes, stack, vault);
    return this.activeStage;
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
    project.attributes = await project.storage.read();
    project.validate();
    return project;
  }
}

export default Project;
