import validate from 'validate.js';
import { join as joinPaths } from 'path';
import {
  clone, difference, flatten, fromPairs, isEmpty, isObject, kebabCase, merge, omit, uniq,
} from 'lodash';

import Configuration from '@stackmate/core/configuration';
import { ValidationError } from '@stackmate/core/errors';
import { Validatable, Project as ProjectInterface } from '@stackmate/interfaces';
import { OUTPUT_DIRECTORY, FORMAT, PROVIDER, SERVICE_TYPE } from '@stackmate/core/constants';
import {
  ProjectConfiguration, NormalizedProjectConfiguration, ProjectDefaults,
  ProviderChoice, StagesNormalizedAttributes, Validations, NormalizedStages,
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
  normalize(contents: ProjectConfiguration): NormalizedProjectConfiguration {
    const { provider, region, stages, defaults } = contents;

    if (!stages) {
      throw new Error('You have to provide a list of stages');
    }

    const getSourceDeclaration = (source: string): object => {
      const stg = stages[source];
      return stg.from ? getSourceDeclaration(stg.from) : stg;
    };

    // the contents have been validated, so it's safe to cast it as NormalizedProjectConfiguration
    const normalized = clone(contents) as NormalizedProjectConfiguration;

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
    }));

    Object.assign(normalized, {
      stages: normalizedStages,
      defaults: defaults || {},
    });

    return normalized;
  }

  /**
   * Get the configuration for the stage selected
   *
   * @param {String} name the name of the stage to get
   * @returns {Object} the configuration for the stage
   */
  stage(name: string): NormalizedStages {
    if (!this.contents.stages) {
      throw new Error('The project doesn’t provide any stages available for deployment');
    }

    if (!this.contents.stages[name]) {
      throw new Error(
        `Stage ${name} was not found in the project. Available options are ${Object.keys(this.contents.stages)}`,
      );
    }

    return this.contents.stages[name];
  }

  /**
   * @returns {String} the output path for the generated resources
   */
  public get outputPath() : string {
    const { name } = this.contents;
    return joinPaths(OUTPUT_DIRECTORY, kebabCase(name));
  }
}

export default Project;
