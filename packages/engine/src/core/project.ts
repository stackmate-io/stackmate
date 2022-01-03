import { join as joinPaths } from 'path';
import { clone, defaultsDeep, fromPairs, kebabCase, merge, omit } from 'lodash';

import Vault from '@stackmate/core/vault';
import Stage from '@stackmate/core/stage';
import Configuration from '@stackmate/core/configuration';
import { Attribute } from '@stackmate/lib/decorators';
import { Project as ProjectInterface } from '@stackmate/interfaces';
import { parseObject, parseString } from '@stackmate/lib/parsers';
import { DEFAULT_PROJECT_FILE, OUTPUT_DIRECTORY, FORMAT, PROVIDER, STORAGE, DEFAULT_STAGE } from '@stackmate/constants';
import {
  ProjectConfiguration, NormalizedProjectConfiguration, ProjectDefaults,
  AttributeParsers, VaultConfiguration, ProviderChoice, Validations,
  StageDeclarations, StagesNormalizedAttributes, NormalizedStage,
} from '@stackmate/types';

class Project extends Configuration implements ProjectInterface {
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
  @Attribute vault: VaultConfiguration = { storage: STORAGE.AWS_PARAMS, format: FORMAT.RAW };

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
      vault: Project.normalizeVault(vault, provider, region),
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
   * @returns {String} the output path for the generated resources
   */
  public get outputPath() : string {
    return joinPaths(OUTPUT_DIRECTORY, kebabCase(this.name));
  }

  /**
   * @param {VaultConfiguration} vault the vault configuration
   * @returns {VaultConfiguration} the normalized vault configuration
   */
  static normalizeVault(
    vault: VaultConfiguration, provider: ProviderChoice, region: string,
  ): VaultConfiguration {
    const storage = provider === PROVIDER.AWS ? STORAGE.AWS_PARAMS : STORAGE.FILE;
    const format = storage === STORAGE.AWS_PARAMS ? FORMAT.RAW : FORMAT.YML;
    return defaultsDeep(vault, { format, storage, region });
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
   * @param {String} name the stage's name
   */
  static async synthesize(
    path: string = DEFAULT_PROJECT_FILE,
    stageName: string = DEFAULT_STAGE,
    outputPath: string = '',
  ): Promise<void> {
    const project = await Project.load(STORAGE.FILE, { path }, FORMAT.YML);

    const { storage: vaultStorage, format: vaultFormat, ...vaultStorageOptions } = project.vault;
    const vaultOptions = { project: project.name, stage: stageName, ...vaultStorageOptions };
    const vault = await Vault.load(vaultStorage, vaultOptions, vaultFormat);

    const stage = Stage.factory({
      name: stageName,
      targetPath: outputPath || project.outputPath,
      defaults: project.defaults,
      services: project.stage(stageName),
      vault,
    });

    stage.synthesize();
  }
}

export default Project;
