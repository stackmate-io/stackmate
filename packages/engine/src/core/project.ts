import { isEmpty } from 'lodash';

import Registry from '@stackmate/engine/core/registry';
import Entity from '@stackmate/engine/core/entity';
import { uniqueIdentifier } from '@stackmate/engine/lib/helpers';
import { AWS_REGIONS } from '@stackmate/engine/providers/aws/constants';
import { CLOUD_PROVIDER, DEFAULT_PROFILE_NAME, PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import {
  BaseServices,
  CloudProviderChoice,
  BaseService,
  ProviderChoice,
  BaseEntityConstructor,
  StackmateProject,
  StageConfiguration,
  CoreServiceConfiguration,
} from '@stackmate/engine/types';

class Project extends Entity<StackmateProject.Attributes> implements StackmateProject.Type {
  /**
   * @var {String} schemaId the schema id for the entity
   * @static
   */
  static schemaId: string = '';  // this is the root schema

  /**
   * @var {String} name the project's name
   */
  name: string;

  /**
   * @var {String} provider the default cloud provider for the project
   */
  provider: CloudProviderChoice;

  /**
   * @var {String} region the default cloud region for the project
   */
  region: string;

  /**
   * @var {VaultConfiguration} secrets the vault configuration
   */
  secrets: BaseServices.Vault.Attributes;

  /**
   * @var {BaseServices} state the state configuration
   */
  state: BaseServices.State.Attributes;

  /**
   * @var {Object} stages the stages declarations
   */
  stages: StageConfiguration[] = [];

  /**
   * @param {String} name the name of the stage in the project to return services for
   * @returns {Service[]}
   */
  stage(stageName: string): BaseService.Type[] {
    const cloudServices = this.getCloudServiceAttributes(stageName);
    const defaults = [this.name, stageName];
    const servicesAttributes = [
      this.getStateServiceAttributes(),
      this.getVaultServiceAttributes(),
      ...cloudServices,
    ];

    // Instantiate the services
    const services = servicesAttributes.map((srv) => {
      const { provider = this.provider, region = this.region, type, ...attrs } = srv;
      return Registry.get(provider, type).factory(
        { ...attrs, provider, region, type }, ...defaults,
      );
    });

    this.getProviderServiceAttributes(servicesAttributes).forEach((attrs) => {
      services.push(
        Registry.get(attrs.provider, SERVICE_TYPE.PROVIDER).factory(attrs, ...defaults)
      );
    });

    return services;
  }

  /**
   * @returns {BaseServices.State.Attributes} the attributes for the state service
   */
  protected getStateServiceAttributes(): BaseServices.State.Attributes {
    const { provider = this.provider, region = this.region, ...attrs } = this.state || {};
    return { ...attrs, provider, region, type: SERVICE_TYPE.STATE, name: `${this.name}-state` };
  }

  /**
   * @returns {BaseServices.Vault.Attributes} the attributes for the vault service
   */
  protected getVaultServiceAttributes(): BaseServices.Vault.Attributes {
    const { provider = this.provider, region = this.region, ...attrs } = this.secrets || {};
    return { ...attrs, provider, region, type: SERVICE_TYPE.VAULT, name: `${this.name}-secrets` };
  }

  /**
   * @param {String} stage the stage to get the service attributes for
   * @param {String[]} without the service names to skip
   * @returns {BaseService.Attributes[]} the attributes for the cloud services
   */
  protected getCloudServiceAttributes(stage: string, without: string[] = []): BaseService.Attributes[] {
    if (isEmpty(this.stages)) {
      throw new Error('There aren’t any stages defined for the project');
    }

    const stageConfiguration = this.stages.find(s => s.name === stage);
    if (!stageConfiguration) {
      throw new Error(`Stage ${stage} is not available in the project`);
    }

    const {
      copy: copyFrom = null,
      skip: skipServices = [],
      services: stageServices = [],
    } = stageConfiguration;

    if (isEmpty(stageServices) && !copyFrom) {
      throw new Error(
        `Stage ${stage} is improperly configured. It doesn't provide any services or stage to copy from`,
      );
    }

    const services = [];

    if (copyFrom) {
      services.push(...this.getCloudServiceAttributes(copyFrom, skipServices));
    }

    services.push(...stageServices.filter(srv => !without.includes(srv.name)));

    return services.map((srv) => {
      const {
        provider = this.provider,
        region = this.region,
        links = [],
        profile = DEFAULT_PROFILE_NAME,
        overrides = {},
        ...attrs
      } = srv;

      return { ...attrs, provider, region, links, profile, overrides };
    });
  }

  /**
   * @returns {BaseServices.Provider.Type} the attributes for the provider services
   */
  protected getProviders(services: BaseService.Attributes[], defaults: object = {}): BaseServices.Provider.Type[] {
    const regions: Map<ProviderChoice, Set<string>> = new Map();

    // Iterate the services and keep a mapping of provider => unique set of regions
    services.forEach(({ provider = this.provider, region = this.region }) => {
      const providerRegions = regions.get(provider) || new Set();
      providerRegions.add(region);
      regions.set(provider, providerRegions);
    });

    const providers: BaseServices.Provider.Type[] = [];

    regions.forEach((providerRegions, provider) => {
      providerRegions.forEach((region) => {
        providers.push(
          Registry.get(provider, SERVICE_TYPE.PROVIDER).factory({ region }, ...defaults)
        );
      })
    })

    return providers;
  }

  /**
   * @returns {BaseJsonSchema} provides the JSON schema to validate the entity by
   */
  static schema(this: BaseEntityConstructor<StackmateProject.Type>): StackmateProject.Schema {
    const providers = Object.values(CLOUD_PROVIDER);
    const awsRegions = Object.values(AWS_REGIONS);

    return {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          pattern: '[a-zA-Z0-9-_./]+',
          description: 'The name of the project in a URL-friendly format',
        },
        provider: {
          type: 'string',
          enum: providers,
          description: 'The default provider for your cloud services',
        },
        region: {
          type: 'string',
          description: 'The default region for the provider you have selected',
        },
        secrets: {
          type: 'object',
          description: 'How would you like your services secrets to be stored',
        },
        state: {
          type: 'object',
          description: 'Where would you like your Terraform state to be stored',
        },
        stages: {
          type: 'array',
          description: 'The deployment stages for your projects',
          errorMessage: 'The stages configuration is invalid',
          minItems: 1,
          items: {
            type: 'object',
            oneOf: [
              { required: ['name', 'services'] },
              { required: ['name', 'copy'] },
            ],
            properties: {
              name: {
                type: 'string',
              },
              services: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: true,
                  required: ['name', 'type'],
                  properties: {
                    name: {
                      type: 'string',
                    },
                    type: {
                      type: 'string',
                    },
                    provider: {
                      type: 'string',
                    },
                  },
                },
              },
              copy: {
                type: 'string',
              },
              skip: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
      required: ['name', 'provider', 'region', 'stages'],
      allOf: [{
        if: { properties: { provider: { const: PROVIDER.AWS } } },
        then: { properties: { region: { $ref: 'regions/aws' } } },
      }],
      $defs: {
        'regions/aws': {
          $id: 'regions/aws',
          type: 'string',
          enum: awsRegions,
          errorMessage: `The region is invalid. Available options are: ${awsRegions.join(', ')}`,
        },
      },
      errorMessage: {
        _: 'The configuration for the project is invalid',
        type: 'The configuration should be an object',
        properties: {
          name: 'The name for the project only accepts characters, numbers, dashes, underscores, dots and forward slashes',
          provider: `The provider is not valid. Accepted options are ${providers.join(', ')}`,
        },
        required: {
          name: 'You need to set a name for the project',
          provider: 'You need to set a default provider for the project',
          region: 'You need to set a default region for the project',
          stages: 'You should define at least one stage to deploy',
        },
      },
    };
  }
}

export default Project;
