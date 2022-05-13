import { AWS_REGIONS } from './providers/aws/constants';
import { PROVIDER, CLOUD_PROVIDER } from './constants';

const providers = Object.values(CLOUD_PROVIDER);
const awsRegions = Object.values(AWS_REGIONS);

const schema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  name: {
    type: 'string',
    pattern: '[a-z0-9-_./]+',
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
    errorMessage: 'You should define at least one stage to deploy',
    minProperties: 1,
    patternProperties: {
      "^[a-z0-9_]+$": {
        type: "object",
        minProperties: 1,
        errorMessage: 'You should define at least one service for the stage',
        patternProperties: {
          "^[a-z0-9_]+$": {
            oneOf: [
              { $ref: '/schemas/services/mysql' },
              { $ref: '/schemas/services/redis' },
            ],
          },
        },
      },
    },
  },
  allOf: [{
    if: { properties: { provider: { const: PROVIDER.AWS } } },
    then: { properties: { region: { $ref: '/regions/aws' } } },
  }],
  required: ['name', 'provider', 'region'],
  additionalProperties: false,
  definitions: {
    awsRegions: {
      $id: '/regions/aws',
      type: 'string',
      enum: awsRegions,
      errorMessage: `The region is invalid. Available options are ${awsRegions.join(', ')}`,
    },
  },
  errorMessage: {
    _: 'The configuration for the project is invalid',
    type: 'The configuration should be an object',
    additionalPropertis: 'You added properties that are not valid, please remove those',
    properties: {
      name: 'The name for the project only accepts characters, numbers, dashes, underscores, dots and forward slashes',
      provider: `The provider is not valid. Accepted options are ${providers.join(', ')}`,
    },
    required: {
      name: 'You need to set a name for the project',
      provider: 'You need to set a default provider for the project',
      region: 'You need to set a default region for the project',
    },
  },
};

export default schema;
