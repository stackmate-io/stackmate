import validate from 'validate.js';
import { join as joinPaths } from 'path';
import {
  clone, difference, flatten, fromPairs, isEmpty, isObject, kebabCase, merge, omit, uniq,
} from 'lodash';

import Vault from '@stackmate/core/vault';
import Stage from '@stackmate/core/stage';
import Configuration from '@stackmate/core/configuration';
import { ValidationError } from '@stackmate/lib/errors';
import { Validatable, Project as ProjectInterface } from '@stackmate/interfaces';
import { DEFAULT_PROJECT_FILE, OUTPUT_DIRECTORY, FORMAT, PROVIDER, SERVICE_TYPE, STORAGE, DEFAULT_STAGE } from '@stackmate/core/constants';
import {
  ProjectConfiguration, NormalizedProjectConfiguration, ProjectDefaults,
  ProviderChoice, StagesNormalizedAttributes, Validations, StageDeclarations, VaultConfiguration,
} from '@stackmate/types';

class Project extends Configuration implements Validatable, ProjectInterface {
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
   * Validates the configuration file's structure.
   * The subsequent service values will be validated during service initialization.
   *
   * @param {Object} contents the contents to validate
   * @throws {ValidationError} when the file structure invalid
   */
  validate(contents: ProjectConfiguration): void {
    const errors = validate.validate(contents, this.validations(), {
      fullMessages: false,
    });

    if (!isEmpty(errors)) {
      throw new ValidationError('The project’s configuration file is not valid', errors);
    }
  }

  /**
   * Returns a list of validations to validate the structure of the configuration file with
   *
   * @returns {Validations} the list of validations to use for the config file
   */
  validations(): Validations {
    const providers = Object.values(PROVIDER);

    /**
     * Validates the project's stages
     *
     * @param {Object} stages The stages configuration
     * @returns {String|undefined} The validation error message (if any)
     */
    validate.validators.validateStages = (stages: StagesNormalizedAttributes) => {
      if (isEmpty(stages) || !isObject(stages)) {
        return 'You have to provide a set of stages for the project, in the form of an object';
      }

      const stageErrors: Array<string> = [];

      Object.keys(stages).forEach(stageName => {
        const stage = stages[stageName];

        if (isEmpty(stage)) {
          return stageErrors.push(
            `Stage “${stageName}” does not contain any services`,
          );
        }

        if (Object.values(stage).some(s => !isObject(s))) {
          return stageErrors.push(
            `Stage “${stageName}” contains invalid service configurations. Every service should be declared as an object`,
          );
        }

        const serviceNames = Object.keys(stage);
        serviceNames.forEach(serviceName => {
          const srv = stage[serviceName];

          if (!Boolean(srv.type) || !Object.values(SERVICE_TYPE).includes(srv.type)) {
            stageErrors.push(
              `Stage “${stageName}” contains invalid configuration for service “${serviceName}”`,
            );
          }
        });
      });

      // Make sure the services are properly linked together
      const invalidLinks: Array<[string, Array<string>]> = [];
      Object.keys(stages).forEach(stageName => {
        const serviceNames = Object.keys(stages[stageName]);
        const links = uniq(
          flatten(Object.values(stages[stageName]).map(srv => srv.links || [])),
        );

        const invalidServices = difference(links, serviceNames);
        if (!isEmpty(invalidServices)) {
          stageErrors.push(
            `Stage ${stageName} has invalid links to “${invalidLinks.join('”, “')}”`
          );
        }
      });

      if (!isEmpty(stageErrors)) {
        return stageErrors;
      }
    };

    /**
     * Validates the project's defaults
     *
     * @param {Object} defaults the defaults to validate
     * @returns {String|undefined} the validation error message (if any)
     */
    validate.validators.validateDefaults = (defaults: ProjectDefaults) => {
      // Allow defaults not being defined or empty objects
      if (!defaults || (isObject(defaults) && isEmpty(defaults))) {
        return;
      }

      if (!isObject(defaults) || Object.keys(defaults).some(prov => !providers.includes(prov as ProviderChoice))) {
        return 'The "defaults" entry should contain valid cloud providers in the mapping';
      }
    };

    const storageOptions = Object.values(STORAGE);
    validate.validators.validateVault = () => {
      /*
      'vault.storage': {
        presence: {
          message: 'The storage type for the credentials vault should be specified',
        },
        inclusion: {
          within: storageOptions,
          message: 'The storage type specified for the vault is invalid',
        }
      },
      */
    };

    return {
      name: {
        presence: {
          allowEmpty: false,
          message: 'You have to provide a name for the project',
        },
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
        validateDefaults: true,
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

    const vaultStorageOptions = {
      ...(vaultOptions || {}),
      stage: stageName,
      project: projectName,
    };

    const vault = new Vault({ storage: vaultStorage, ...vaultStorageOptions });
    await vault.load();

    const stage = new Stage(stageName, project.outputPath, defaults)
    stage.populate(services, vault);
    stage.synthesize();
  }
}

export default Project;
