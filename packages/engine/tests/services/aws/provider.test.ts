import { AwsProvider } from '@stackmate/engine/providers';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine';
import { REGIONS } from '@stackmate/engine/providers/aws/constants';
import { ServiceScopeChoice } from '@stackmate/engine/core/service';

describe('AWS Provider', () => {
  const service = AwsProvider;

  it('is a valid AWS provider service', () => {
    expect(service.provider).toEqual(PROVIDER.AWS);
    expect(service.type).toEqual(SERVICE_TYPE.PROVIDER);
  });

  it('has the AWS regions set', () => {
    expect(new Set(service.regions)).toEqual(new Set(REGIONS));
  });

  it('has the handlers registered', () => {
    const scopes: ServiceScopeChoice[] = ['deployable', 'destroyable', 'preparable'];
    expect(new Set(Array.from(service.handlers.keys()))).toEqual(new Set(scopes));
    expect(
      Array.from(service.handlers.values()).every(h => (typeof h === 'function')),
    ).toBeTruthy();
  });

  it('contains a valid schema', () => {
    expect(service.schema).toMatchObject({
      $id: 'services/aws/provider',
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
          enum: [SERVICE_TYPE.PROVIDER],
          default: 'provider',
        },
        region: {
          type: 'string',
          enum: Array.from(REGIONS),
          default: 'eu-central-1',
        },
        profile: { type: 'string', default: 'default', serviceProfile: true },
        overrides: { type: 'object', default: {}, serviceProfileOverrides: true }
      },
    });
  });

  /*
  it('registers the service into the stack and creates the deployable provisions');
  it('registers the service into the stack and creates the destroyable provisions');
  it('registers the service into the stack and creates the preparable provisions');
  */
});
