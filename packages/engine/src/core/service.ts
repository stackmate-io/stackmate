import { merge } from 'lodash';
import { Memoize } from 'typescript-memoize';

import Entity from '@stackmate/engine/core/entity';
import Profile from '@stackmate/engine/core/profile';
import {
  PROVIDER,
  SERVICE_TYPE,
  CORE_SERVICE_TYPES,
  DEFAULT_PROFILE_NAME,
  CORE_SERVICE_SKIPPED_PROPERTIES,
} from '@stackmate/engine/constants';
import {
  CloudStack,
  BaseService,
  ResourceProfile,
  ProviderChoice,
  ServiceTypeChoice,
  ServiceScopeChoice,
  ServiceAssociations,
  ConfigurationOptions,
  EntityAttributes,
  ServicePrerequisites,
  EnvironmentVariable,
} from '@stackmate/engine/types';

abstract class Service<Attrs extends EntityAttributes = BaseService.Attributes> extends Entity<Attrs> implements BaseService.Type {
  /**
   * @var {String} schemaId the schema id for the entity
   * @static
   */
  static schemaId: string = 'project';

  /**
   * @var {String} name the service's name
   */
  name: string;

  /**
   * @var {String[]} links the list of service names that the current service
   *                                             is associated (linked) with
   */
  links: string[] = [];

  /**
   * @var {String} profile any configuration profile for the service
   */
  profile: string = DEFAULT_PROFILE_NAME;

  /**
   * @var {Object} overrides any profile overrides to use
   */
  overrides: object = {};

  /**
   * @var {String} projectName the name of the project that the
   */
  projectName: string;

  /**
   * @var {String} stageName the name of the stage that the service is deployed to
   */
  stageName: string;

  /**
   * @var {String} type the service's type
   * @abstract
   * @readonly
   */
  abstract readonly type: ServiceTypeChoice;

  /**
   * @var {String} provider the service's cloud provider
   * @abstract
   * @readonly
   */
  abstract readonly provider: ProviderChoice;

  /**
   * @returns {EnvironmentVariable[]} the environment variables required to provision the service
   */
  abstract environment(): EnvironmentVariable[];

  /**
   * @constructor
   * @param {String} projectName the project's name
   * @param {String} stageName the stage's name
   */
  constructor(projectName: string, stageName: string) {
    super();

    if (!projectName) {
      throw new Error('You have to provide a projectName for the service');
    }

    if (!stageName) {
      throw new Error('You have to provide a stageName for the service')
    }

    this.projectName = projectName;
    this.stageName = stageName;
  }

  /**
   * Provisioning when we deploy a stage
   *
   * @param {CloudStack} stack the stack to provision the service in
   * @param {ServicePrerequisites} prerequisites the services prerequisites
   */
  abstract onDeploy(stack: CloudStack, prerequisites: ServicePrerequisites): void;

  /**
   * Provisioning when we initially prepare a stage
   *
   * @param {CloudStack} stack the stack to provision the service in
   * @param {ServicePrerequisites} prerequisites the services prerequisites
   */
  onPrepare(stack: CloudStack, prerequisites: ServicePrerequisites): void {
    // no-op. most services are not required when preparing the stage
  }

  /**
   * Provisioning on when we destroy destroy a stage
   *
   * @param {CloudStack} stack the stack to provision the service in
   * @param {ServicePrerequisites} prerequisites the services prerequisites
   */
  onDestroy(stack: CloudStack, prerequisites: ServicePrerequisites): void {
    // no-op. this just removes the resources from the stack
  }

  /**
   * @returns {String} the service's identifier
   */
  get identifier(): string {
    return `${this.name}-${this.stageName}`.toLowerCase();
  }

  /**
   * @returns {Object} the profile to use for the resources
   */
  @Memoize() get resourceProfile(): ResourceProfile {
    if (!this.profile) {
      return {};
    }

    const profile = Profile.get(this.provider, this.type, this.profile);
    return merge(profile, this.overrides) as ResourceProfile;
  }

  /**
   * Applies the scope to the service
   *
   * @param scope the scope to apply to the service
   * @returns {BaseService.Type} the service with the scope applied
   */
  scope(scope: ServiceScopeChoice): BaseService.Type {
    let handlerFunction: (stack: CloudStack, prerequisites: ServicePrerequisites) => void;

    switch(scope) {
      case 'preparable':
        handlerFunction = this.onPrepare.bind(this);
        break;
      case 'deployable':
        handlerFunction = this.onDeploy.bind(this);
        break;
      case 'destroyable':
        handlerFunction = this.onDestroy.bind(this);
        break;
      default:
        throw new Error(`Scope ${scope} is invalid`);
    }

    Reflect.set(this, 'provisions', new Proxy(this.provisions, {
      apply: (_target, thisArg, args: [s: CloudStack, p: ServicePrerequisites]) => (
        handlerFunction.apply(thisArg, args)
      ),
    }));

    return this;
  }

  /**
   * Registers the service in the stack
   *
   * @param {CloudStack} stack the stack to provision
   * @param {ServicePrerequisites} prerequisites the services prerequisites
   */
  provisions(stack: CloudStack, prerequisites: ServicePrerequisites) {
    throw new Error('No scope has been applied, you have to use the `scope` method first');
  }

  /**
   * @returns {ServiceAssociations} the pairs of lookup and handler functions
   */
  associations(): ServiceAssociations {
    return [];
  }

  /**
   * @returns {BaseJsonSchema} provides the JSON schema to validate the entity by
   */
  static schema(): BaseService.Schema {
    const providers = Object.values(PROVIDER);
    const services = Object.values(SERVICE_TYPE);

    return {
      $id: this.schemaId,
      type: 'object',
      additionalProperties: false,
      required: [],
      properties: {
        provider: {
          type: 'string',
          enum: providers,
          errorMessage: `You have to specify a valid provider. Available options are: ${providers.join(', ')}`,
        },
        type: {
          type: 'string',
          enum: services,
          errorMessage: `You have to specify a valid service type. Available options are: ${services.join(', ')}`,
        },
        name: {
          type: 'string',
          pattern: '[a-zA-Z0-9_]+',
          description: 'The name for the service to deploy',
          errorMessage: 'The name for the service should only contain characters, numbers and underscores',
        },
        profile: {
          type: 'string',
          default: DEFAULT_PROFILE_NAME,
          serviceProfile: true,
        },
        links: {
          type: 'array',
          default: [],
          serviceLinks: true,
          items: { type: 'string' },
        },
        overrides: {
          type: 'object',
          default: {},
          serviceProfileOverrides: true,
        },
      },
      errorMessage: {
        _: 'The service configuration is invalid',
        required: {
          name: 'You have to specify a name for the service',
          type: `You need to specify a service type. Available options are: ${services.join(', ')}`,
        },
      },
      if: {
        // Core services
        anyOf: CORE_SERVICE_TYPES.map(srv => ({ properties: { type: { const: srv } } })),
      },
      then: {
        // Prevent certain attributes from being assigned
        allOf: CORE_SERVICE_SKIPPED_PROPERTIES.map(prop => ({
          not: { required: [prop] },
          errorMessage: `The “${prop}” property is not allowed here`,
        })),
      },
      else: {
        // otherwise, require the name and type to be present
        required: ['name', 'type'],
      }
    };
  }

  /**
   * @returns {Object} the attributes to use when populating the initial configuration
   */
  static config({ projectName = '', stageName = '' }): ConfigurationOptions<BaseService.Attributes> {
    throw new Error('The config() method is not available for this service');
  }
}

export default Service;
