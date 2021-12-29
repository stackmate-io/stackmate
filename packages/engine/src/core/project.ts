import { join as joinPaths } from 'path';
import { clone, defaultsDeep, fromPairs, isEmpty, kebabCase, merge, omit } from 'lodash';

import Vault from '@stackmate/core/vault';
import Stage from '@stackmate/core/stage';
import Configuration from '@stackmate/core/configuration';
import { Attribute } from '@stackmate/lib/decorators';
import { Project as ProjectInterface } from '@stackmate/interfaces';
import { DEFAULT_PROJECT_FILE, OUTPUT_DIRECTORY, FORMAT, PROVIDER, STORAGE, DEFAULT_STAGE } from '@stackmate/constants';
import {
  ProjectConfiguration, NormalizedProjectConfiguration, ProjectDefaults, AttributeParsers,
  VaultConfiguration, ProviderChoice, Validations, StageDeclarations, StorageChoice,
} from '@stackmate/types';
import { parseObject, parseString } from '@stackmate/lib/parsers';

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
  @Attribute vault: VaultConfiguration = { storage: STORAGE.AWS_PARAMS };

  /**
   * @var {Object} stages the stages declarations
   */
  @Attribute stages: StageDeclarations = {};

  /**
   * @var {Object} defaults the project's defaults
   */
  @Attribute defaults: ProjectDefaults = {};

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

    this.attributes = this.contents;

    this.validate();

    return this.contents;
  }

  /**
   * @returns {String} the error message
   */
  public get validationMessage(): string {
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
      provider: parseString,
      region: parseString,
      vault: parseObject,
      stages: parseObject,
      defaults: parseObject,
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
      vault: defaultsDeep(vault, { storage: Project.defaultVaultStorage(provider), region }),
      defaults: defaults || {},
    });

    console.log({ normalized });
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
   * @returns {StorageChoice} the default storage choice
   */
  static defaultVaultStorage(provider: ProviderChoice): StorageChoice {
    if (provider === PROVIDER.AWS) {
      return STORAGE.AWS_PARAMS;
    }

    return STORAGE.FILE;
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
    const project = new Project({ path, storage: STORAGE.FILE });
    await project.load();

    if (!project.contents.stages) {
      throw new Error('The project doesn’t provide any stages available for deployment');
    }

    const {
      contents: {
        name: projectName,
        stages,
        stages: { [stageName]: services },
        vault: vaultOptions = { storage: STORAGE.FILE },
        defaults,
      },
    } = project;

    if (!services || isEmpty(services)) {
      throw new Error(
        `Stage ${stageName} was not found in the project. Available options are ${Object.keys(stages)}`,
      );
    }

    const vault = new Vault({ ...vaultOptions, stage: stageName, project: projectName });
    await vault.load();

    const output: string = outputPath || project.outputPath;
    const stage = new Stage(stageName, output, defaults).populate(services, vault);
    stage.stack.synthesize();
  }
}

export default Project;
