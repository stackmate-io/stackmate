import { get } from 'lodash';
import { Memoize } from 'typescript-memoize';

import Entity from '@stackmate/lib/entity';
import App from '@stackmate/lib/terraform/app';
import Stage from '@stackmate/core/stage';
import { Attribute } from '@stackmate/lib/decorators';
import { normalizeProject } from '@stackmate/lib/normalizers';
import { CloudApp, StorageAdapter } from '@stackmate/interfaces';
import { getStoragAdaptereByType } from '@stackmate/storage';
import { getVaultByProvider } from '@stackmate/vault';
import { parseObject, parseString } from '@stackmate/lib/parsers';
import { PROVIDER, STORAGE, FORMAT, VAULT_PROVIDER, DEBUG_MODE } from '@stackmate/constants';
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
   * @var {CloudApp} app the terraform app to deploy
   */
  public readonly app: CloudApp;

  /**
   * @constructor
   * @param {String} path the project's file path
   * @param {String} outputPath the output path for the stack
   */
  constructor(path: string, app: CloudApp) {
    super();

    this.path = path;
    this.app = app;
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
   * Selects a workspace to be deployed
   *
   * @param {String} name the workspace's name
   */
  select(name: string) {
    const { provider = VAULT_PROVIDER.AWS, ...vaultOpts } = this.secrets;

    const stack = this.app.stack(name);
    const vault = getVaultByProvider(
      stack, provider, { ...vaultOpts, project: this.name, stage: name },
    );

    return Stage.factory(
      stack, vault, { name, services: get(this.stages, name, {}), defaults: this.defaults },
    );
  }

  /**
   * Loads and validates the project
   *
   * @param {String} fileName the file name to load the project from
   * @returns {Project} the project loaded and validated
   * @async
   */
  static async load(fileName: string, outputPath: string): Promise<Project> {
    const app = new App({ outdir: outputPath, stackTraces: DEBUG_MODE });
    const project = new Project(fileName, app);

    project.attributes = await project.storage.read();
    project.validate();

    return project;
  }
}

export default Project;
