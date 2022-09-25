import { AwsState } from '@stackmate/engine/providers';
import { DEFAULT_REGION, REGIONS } from '@stackmate/engine/providers/aws/constants';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine';
import { onDeploy, onDestroy, onPrepare } from '@stackmate/engine/providers/aws/services/state';

describe('AWS state', () => {
  const service = AwsState;

  it('is a valid AWS secrets service', () => {
    expect(service.provider).toEqual(PROVIDER.AWS);
    expect(service.type).toEqual(SERVICE_TYPE.STATE);
  });

  it('has the AWS regions set', () => {
    expect(new Set(service.regions)).toEqual(new Set(REGIONS));
  });

  it('has the handlers registered', () => {
    expect(service.handlers.get('deployable')).toEqual(onDeploy);
    expect(service.handlers.get('preparable')).toEqual(onPrepare);
    expect(service.handlers.get('destroyable')).toEqual(onDestroy);
  });

  it('contains a valid schema', () => {
    expect(service.schema).toMatchObject({
      $id: 'services/aws/state',
      type: 'object',
      required: ['region', 'bucket'],
      additionalProperties: false,
      properties: {
        provider: {
          type: 'string',
          enum: [PROVIDER.AWS],
          default: 'aws',
        },
        type: {
          type: 'string',
          enum: [SERVICE_TYPE.STATE],
          default: SERVICE_TYPE.STATE,
        },
        region: {
          type: 'string',
          enum: Array.from(REGIONS),
          default: DEFAULT_REGION,
        },
        bucket: {
          type: 'string',
          minLength: 3,
          maxLength: 63,
          isIncludedInConfigGeneration: true,
          serviceConfigGenerationTemplate: 'stackmate-state-${type}-${projectName}',
        },
      },
    });
  });
});
