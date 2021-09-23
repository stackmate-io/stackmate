import { clone, difference, flatten, fromPairs, isEmpty, isObject, merge, omit, pick, uniq } from 'lodash';
import validate from 'validate.js';

import File from '@stackmate/core/file';
import { FORMAT, PROVIDER, SERVICE_TYPE } from '@stackmate/core/constants';
import { Validatable } from '@stackmate/interfaces';
import { ValidationError } from '@stackmate/core/errors';
import {
  ConfigurationFileContents, NormalizedFileContents, ProjectDefaults,
  ProviderChoice, StagesNormalizedAttributes, Validations,
} from '@stackmate/types';

class Configuration extends File implements Validatable {
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
  readonly stages: StagesNormalizedAttributes;

  /**
   * @var {String} format the file's format (eg. YML, JSON)
   */
  format: string = FORMAT.YML;

  async load(): Promise<object> {
    await super.load();

    this.validate(this.contents);

    // assign the name, stages and defaults to the corresponding attributes
    Object.assign(
      this as any, pick(Configuration.normalize(this.contents), 'name', 'stages', 'defaults'),
    );

    return this.contents;
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

      // Make sure the services are properly linked together
      const invalidLinks: Array<[string, Array<string>]> = [];
      Object.keys(stages).forEach(stageName => {
        const serviceNames = Object.keys(stages[stageName]);
        const links = uniq(
          flatten(Object.values(stages[stageName]).map(srv => srv.links || [])),
        );

        const invalidServices = difference(links, serviceNames);
        if (!isEmpty(invalidServices)) {
          invalidLinks.push([stageName, invalidServices]);
        }
      });

      if (!isEmpty(invalidLinks)) {
        const stageMessages = invalidLinks.map(([stageName, invalidLinks]) => (
          `Stage ${stageName} has invalid links to “${invalidLinks.join('”, “')}”`
        ));

        return `There are invalid services linked with each other: ${stageMessages}. Please check the links section of your services`;
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
}

export default Configuration;
