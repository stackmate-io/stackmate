import { AwsSecretsVault } from '@stackmate/engine/providers';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import { DEFAULT_REGION, REGIONS } from '@stackmate/engine/providers/aws/constants';

describe('AWS Secrets service', () => {
  const service = AwsSecretsVault;

  it('is a valid AWS state service', () => {
    expect(service.provider).toEqual(PROVIDER.AWS);
    expect(service.type).toEqual(SERVICE_TYPE.SECRETS);
  });

  it('has the AWS regions set', () => {
    expect(new Set(service.regions)).toEqual(new Set(REGIONS));
  });

  it('does not have any handlers registered', () => {
    expect(service.handlers.get('deployable')).toBeUndefined();
    expect(service.handlers.get('destroyable')).toBeUndefined();
    expect(service.handlers.get('preparable')).toBeUndefined();
  });

  it('contains a valid schema', () => {
    expect(service.schema).toMatchObject({
      $id: 'services/aws/secrets',
      type: 'object',
      required: ['region'],
      additionalProperties: false,
      properties: {
        provider: {
          type: 'string',
          enum: [PROVIDER.AWS],
          default: 'aws',
        },
        type: {
          type: 'string',
          enum: [SERVICE_TYPE.SECRETS],
          default: SERVICE_TYPE.SECRETS,
        },
        region: {
          type: 'string',
          enum: Array.from(REGIONS),
          default: DEFAULT_REGION,
        },
        profile: { type: 'string', default: 'default', serviceProfile: true },
        overrides: { type: 'object', default: {}, serviceProfileOverrides: true }
      },
    });
  });

  describe('credentials handlers', () => {
    it('registers and returns the credentials', () => {
    });
  });
});
