import { join as joinPaths } from 'path';
import { clone, fromPairs, isEmpty, kebabCase, merge, omit } from 'lodash';

import Vault from '@stackmate/core/vault';
import Stage from '@stackmate/core/stage';
import Configuration from '@stackmate/core/configuration';
import { Project as ProjectInterface } from '@stackmate/interfaces';
import { DEFAULT_PROJECT_FILE, OUTPUT_DIRECTORY, FORMAT, PROVIDER, STORAGE, DEFAULT_STAGE } from '@stackmate/constants';
import {
  ProjectConfiguration, NormalizedProjectConfiguration,
  ProviderChoice, Validations, StageDeclarations, VaultConfiguration,
} from '@stackmate/types';

class Project extends Configuration implements ProjectInterface {
  /**
   * @var {Object} contents the file's contents in a structured format
   */
  contents: NormalizedProjectConfiguration;

  /**
   * @var {String} format the file's format (eg. YML, JSON)
   */
  format: string = FORMAT.YML;

  /**
   * @returns {Promise<Object>} the file's contents
   */
  async load(): Promise<object> {
    await super.load();

    this.validate(this.contents);

    return this.contents;
  }

  /**
   * @param {Object} contents the projects's contents
   * @returns {String} the error message
   */
  public getValidationError(contents: ProjectConfiguration): string {
    return 'The project’s configuration file is not valid';
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
          pattern: '[a-z0-9-_.\/]+',
          message: 'The project name needs to be in URL-friendly format, same as the repository name',
        }
      },
      vault: {
        validateVault: true,
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
      stages: {
        validateStages: true,
      },
      defaults: {
        validateProjectDefaults: true,
      },
    };
  }

  /**
   * Applies arguments in stage services that were skipped for brevity
   *
   * @param {Object} contents the file contents that are to be normalized
   * @returns {Object} the normalized contents
   */
  normalize(contents: ProjectConfiguration): NormalizedProjectConfiguration {
    // the contents have been validated, so it's safe to cast it as NormalizedProjectConfiguration
    const normalized = clone(contents) as NormalizedProjectConfiguration;
    const { vault, provider, region, stages, defaults } = normalized;

    Object.assign(normalized, {
      stages: this.normalizeStages(stages, provider, region),
      vault: this.normalizeVault(vault, provider, region),
      defaults: defaults || {},
    });

    return normalized;
  }

  /**
   * @returns {String} the output path for the generated resources
   */
  public get outputPath() : string {
    const { name } = this.contents;
    return joinPaths(OUTPUT_DIRECTORY, kebabCase(name));
  }

  /**
   * Normalizes the stages configuration
   *
   * @param stages {Object} the stages to normalize
   * @param provider {String} the project's default provider
   * @param region {String} the project's default string
   * @returns {Object} the normalized stages
   */
  private normalizeStages(stages: StageDeclarations, provider: ProviderChoice, region: string) {
    const getSourceDeclaration = (source: string): object => {
      const stg = stages[source];
      return stg.from ? getSourceDeclaration(stg.from) : stg;
    };

    const normalizedStages = Object.keys(stages || []).map(stageName => {
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
          omit(getSourceDeclaration(copiedStageName), ...skippedServices)
        );

        stage = merge(omit(source, 'from', 'skip'), declaration);
      }

      Object.keys(stage).forEach(name => {
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
   * Normalizes a project's vault configuration
   *
   * @param vault {Object} the vault configuration
   * @param provider {String} the default provider for the project
   * @param region {String} the default region for the project
   * @returns {Object} the normalized vault contents
   */
  private normalizeVault(vault: VaultConfiguration, provider: ProviderChoice, region: string) {
    const { storage, region: vaultRegion, ...vaultAttrs } = vault;

    const normalizedVault = { storage, region: vaultRegion, ...vaultAttrs };

    if (!storage && provider === PROVIDER.AWS) {
      Object.assign(normalizedVault, { storage: STORAGE.AWS_PARAMS });
    }

    if (!region) {
      Object.assign(normalizedVault, { region });
    }

    return normalizedVault;
  }

  /**
   * @param {String} path loads and returns a project from a file
   * @param {String} name the stage's name
   */
  static async synthesize(path: string = DEFAULT_PROJECT_FILE, stageName: string = DEFAULT_STAGE): Promise<void> {
    const project = new Project({ path, storage: STORAGE.FILE })
    await project.load();

    if (!project.contents.stages) {
      throw new Error('The project doesn’t provide any stages available for deployment');
    }

    const {
      contents: {
        defaults,
        stages,
        name: projectName,
        stages: { [stageName]: services },
        vault: { storage: vaultStorage = STORAGE.FILE, ...vaultOptions },
      },
    } = project;

    if (!services || isEmpty(services)) {
      throw new Error(
        `Stage ${stageName} was not found in the project. Available options are ${Object.keys(stages)}`,
      );
    }

    const vaultStorageOptions = { ...(vaultOptions || {}), stage: stageName, project: projectName };
    const vault = new Vault({ storage: vaultStorage, ...vaultStorageOptions });
    await vault.load();

    const stage = new Stage(stageName, project.outputPath, defaults)
    stage.populate(services, vault);
    stage.synthesize();
  }
}

export default Project;
