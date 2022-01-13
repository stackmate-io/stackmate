import { join as joinPaths } from 'path';
import { Memoize } from 'typescript-memoize';
import { clone, defaultsDeep, fromPairs, kebabCase, merge, omit } from 'lodash';

import Vault from '@stackmate/core/vault';
import Stage from '@stackmate/core/stage';
import Configuration from '@stackmate/core/configuration';
import FileStorageAdapter from '@stackmate/storage/file';
import { Attribute } from '@stackmate/lib/decorators';
import { parseObject, parseString } from '@stackmate/lib/parsers';
import {
  DEFAULT_PROJECT_FILE, OUTPUT_DIRECTORY, PROVIDER, DEFAULT_STAGE,
} from '@stackmate/constants';
import {
  ProjectConfiguration, NormalizedProjectConfiguration, ProjectDefaults,
  AttributeParsers, VaultConfiguration, ProviderChoice, Validations,
  StageDeclarations, StagesNormalizedAttributes, NormalizedStage,
} from '@stackmate/types';

class Project extends Configuration {
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
  @Attribute vault: VaultConfiguration = { provider: PROVIDER.AWS };

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
   * @var {String} path the file's path
   */
  readonly path: string;

  /**
   * @param {String} path the project's file path
   * @constructor
   */
  constructor(path: string, outputPath = null) {
    super();

    this.path = path;
  }

  /**
   * @returns {FileStorageAdapter} the storage adapter to use for reading the file
   */
  @Memoize()
  get storage() {
    return FileStorageAdapter.factory({ path: this.path });
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
      vault: {
        validateVault: {},
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
      vault: parseObject,
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
    // the configuration have been validated, so it's safe to cast it as NormalizedProjectConfiguration
    const normalized = clone(configuration) as NormalizedProjectConfiguration;
    const { provider, region, stages, vault, defaults = {} } = normalized;

    Object.assign(normalized, {
      stages: Project.normalizeStages(stages, provider, region),
      vault: defaultsDeep(vault, { provider, region }),
      defaults,
    });

    return normalized;
  }

  /**
   * Returns the services for a given stage
   *
   * @param {String} name the name of the stage to get the services for
   * @returns {Object} the stage's services
   */
  public stage(name: string): NormalizedStage {
    return this.stages[name];
  }

  /**
   * Normalizes the stages configuration
   *
   * @param stages {Object} the stages to normalize
   * @param provider {String} the project's default provider
   * @param region {String} the project's default string
   * @returns {Object} the normalized stages
   */
  static normalizeStages(stages: StageDeclarations, provider: ProviderChoice, region: string) {
    const getSourceDeclaration = (source: string): object => {
      const stg = stages[source];
      return stg.from ? getSourceDeclaration(stg.from) : stg;
    };

    const normalizedStages = Object.keys(stages || []).map((stageName) => {
      const {
        from: copiedStageName = null,
        skip: skippedServices = [],
        ...declaration
      } = stages[stageName];

      let stage = clone(declaration);

      // Copy the full attributes to stages that copy each other
      if (copiedStageName) {
        const source = clone(
          // Omit any services that the copied stage doesn't need
          omit(getSourceDeclaration(copiedStageName), ...skippedServices),
        );

        stage = merge(omit(source, 'from', 'skip'), declaration);
      }

      Object.keys(stage).forEach((name) => {
        const service = stage[name]!;

        // Apply the service's name
        Object.assign(service, { name });

        // Apply the service's provider (if not any)
        if (!service.provider) {
          Object.assign(service, { provider });
        }

        // Apply the service's region (if not any)
        if (!service.region) {
          Object.assign(service, { region });
        }
      });

      return [stageName, stage];
    });

    return fromPairs(normalizedStages);
  }

  /**
   * Synthesize the stack and prepare for provision
   *
   * @param {String} path loads and returns a project from a file
   * @param {String} stageName the stage's name
   * @param {String} outputPath the path to write the output files to
   * @void
   */
  static async synthesize(
    path: string = DEFAULT_PROJECT_FILE,
    stageName: string = DEFAULT_STAGE,
    outputPath: string = '',
  ): Promise<void> {
    const project = new Project(path);
    await project.load();

    const vault = new Vault(project.name, stageName, project.vault);
    await vault.load();

    const targetPath = outputPath || joinPaths(OUTPUT_DIRECTORY, kebabCase(project.name));
    const stage = Stage.factory({
      name: stageName,
      defaults: project.defaults,
      services: project.stage(stageName),
      targetPath,
      vault,
    });

    stage.synthesize();
  }
}

export default Project;
