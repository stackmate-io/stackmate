import { has, isEmpty } from 'lodash';

import Registry from '@stackmate/engine/core/registry';
import Entity from '@stackmate/engine/core/entity';
import { uniqueIdentifier } from '@stackmate/engine/lib/helpers';
import { AWS_REGIONS } from '@stackmate/engine/providers/aws/constants';
import { CLOUD_PROVIDER, DEFAULT_PROFILE_NAME, PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import {
  BaseServices,
  StagesConfiguration,
  CloudProviderChoice,
  BaseService,
  ProviderChoice,
  BaseEntityConstructor,
  StackmateProject,
} from '@stackmate/engine/types';

class Project extends Entity<StackmateProject.Attributes> implements StackmateProject.Type {
  /**
   * @var {String} schemaId the schema id for the entity
   * @static
   */
  static schemaId: string = '';  // this is the root schema

  /**
   * @var {String} keyPattern the key pattern for the schema's properties
   * @static
   */
  static keyPattern: string = '^[a-zA-Z0-9_]+$';

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
  stages: StagesConfiguration = {};

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
    return [
      ...this.getProviderServiceAttributes(servicesAttributes),
      ...servicesAttributes,
    ].map((srv) => {
      const { provider = this.provider, region = this.region, type, ...attrs } = srv;
      return Registry.get(provider, type).factory(
        { ...attrs, provider, region, type }, ...defaults,
      );
    });
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

    if (!has(this.stages, stage)) {
      throw new Error(`Stage ${stage} is not available in the project`);
    }

    const { copy: copyFrom = null, skip: skipServices = [], ...stageServices } = this.stages[stage];

    const services = [];

    if (copyFrom) {
      services.push(...this.getCloudServiceAttributes(copyFrom, skipServices));
    }

    services.push(...Object.values(stageServices).filter(srv => !without.includes(srv.name)));

    return services.map(srv => {
      const { provider = this.provider, region = this.region, ...attrs } = srv;
      return { ...attrs, provider, region };
    });
  }

  /**
   * @returns {BaseServices.Provider.Type} the attributes for the provider services
   */
  protected getProviderServiceAttributes(services: BaseService.Attributes[]): BaseServices.Provider.Attributes[] {
    const regions: Map<ProviderChoice, Set<string>> = new Map();

    // Iterate the services and keep a mapping of provider => unique set of regions
    services.forEach(({ provider = this.provider, region = this.region }) => {
      const providerRegions = regions.get(provider) || new Set();
      providerRegions.add(region);
      regions.set(provider, providerRegions);
    });

    const providerAttributes: BaseServices.Provider.Attributes[] = [];
    regions.forEach((providerRegions, provider) => {
      providerRegions.forEach((region) => {
        providerAttributes.push({
          type: SERVICE_TYPE.PROVIDER,
          name: uniqueIdentifier(`provider-${provider}`, { region }),
          provider,
          region,
          links: [],
          profile: DEFAULT_PROFILE_NAME,
          overrides: {},
        });
      })
    })

    return providerAttributes;
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
          type: 'object',
          description: 'The deployment stages for your projects',
          errorMessage: 'The stages configuration is invalid',
          minProperties: 1,
          patternProperties: {
            [Project.keyPattern]: {
              type: 'object',
              minProperties: 1,
              errorMessage: 'You need to either define at least one service or copy another stage’s configuration',
              patternProperties: {
                [Project.keyPattern]: {
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
