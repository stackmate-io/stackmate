import fs from 'fs';
import { resolve as resolvePath } from 'path';
import { clone, fromPairs, isEmpty, isObject, merge, omit } from 'lodash';
import validate from 'validate.js';
import YAML from 'yaml';

import { PROVIDER, SERVICE_TYPE } from '@stackmate/core/constants';
import { ConfigurationFileContents, NormalizedFileContents, ProjectDefaults, ProviderChoice, StagesAttributes, Validations } from '@stackmate/types';
import { Validatable } from '@stackmate/interfaces';
import { ValidationError } from '@stackmate/core/errors';

class Configuration implements Validatable {
  /**
   * @var {String} path the path for the configuration file
   * @readonly
   */
  readonly path: string;

  /**
   * @var {String} name the project's name
   * @readonly
   */
  readonly name: string;

  /**
   * @var {Object} defaults the defaults to apply to the project
   * @readonly
   */
  readonly defaults: ProjectDefaults;

  /**
   * @var {Object} stages the list of stages in the project
   * @readonly
   */
  readonly stages: StagesAttributes;

  constructor(contents: ConfigurationFileContents, path: string) {
    this.validate(contents);
    this.path = path;

    const { name, stages, defaults } = Configuration.normalize(contents);

    this.name = name;
    this.stages = stages;
    this.defaults = defaults;
  }

  /**
   * Validates the configuration file's structure.
   * The subsequent service values will be validated during service initialization.
   *
   * @param {Object} contents the contents to validate
   * @throws {ValidationError} when the file structure invalid
   */
  validate(contents: ConfigurationFileContents): void {
    const errors = validate.validate(contents, this.validations(), {
      fullMessages: false,
    });

    if (errors) {
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
    validate.validators.validateStages = (stages: StagesAttributes) => {
      if (isEmpty(stages)) {
        return 'You have to provide a set of stages for the project';
      }

      if (!isObject(stages) || Object.values(stages).some(s => !isObject(s))) {
        return 'The stages for the project should be an object whose every member is an object';
      }

      const stagesHaveServiceTypesDefined = Object.values(stages).every(
        stage => Object.values(stage).every(
          srv => Boolean(srv.type) && Object.values(SERVICE_TYPE).includes(srv.type),
        ),
      );

      if (!stagesHaveServiceTypesDefined) {
        return 'You have to specify a type for every service in the stages';
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

    return {
      name: {
        presence: {
          allowEmpty: false,
          message: 'You have to provide a name for the project',
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
  static normalize(contents: ConfigurationFileContents): NormalizedFileContents {
    const { provider, region, stages, defaults } = contents;

    if (!stages) {
      throw new Error('You have to provide a list of stages');
    }

    // the contents have been validated, so it's safe to cast it as NormalizedFileContents
    const normalized = clone(omit(contents, 'provider', 'region') as NormalizedFileContents);

    const normalizedStages = fromPairs(Object.keys(stages || []).map(stageName => {
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
          omit(stages[copiedStageName], ...skippedServices)
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
    }));

    Object.assign(normalized, {
      stages: normalizedStages,
      defaults: defaults || {},
    });

    return normalized;
  }

  /**
   * Loads a configuration file
   *
   * @param {String} filePath the path to load the configuration from
   * @returns {Configuration} the project configuration, validated and normalized
   */
  static async load(filePath: string) {
    let fileContents;
    const resolvedPath = resolvePath(filePath);

    try {
      fileContents = await fs.promises.readFile(resolvedPath);
    } catch (error) {
      throw new Error('The path for the configuration file specified is invalid');
    }

    let contents;
    try {
      contents = YAML.parse(fileContents.toString());
    } catch (error) {
      throw new Error('The configuration file should be a valid YAML file');
    }

    if (!contents || !isObject(contents)) {
      throw new Error('The configuaration file’s content is invalid');
    }

    return new Configuration(contents as ConfigurationFileContents, resolvedPath);
  }
}

export default Configuration;
