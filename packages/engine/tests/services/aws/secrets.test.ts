import {
  DataAwsSecretsmanagerRandomPassword, DataAwsSecretsmanagerSecretVersion,
  SecretsmanagerSecret, SecretsmanagerSecretVersion,
} from '@cdktf/provider-aws/lib/secretsmanager';

import { AwsSecretsVault } from '@stackmate/engine/providers';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import { DEFAULT_REGION, REGIONS } from '@stackmate/engine/providers/aws/constants';
import { Provisionable } from '@stackmate/engine/core/service';
import { getStack, Stack } from '@stackmate/engine/core/stack';
import { getAwsDeploymentProvisionableMock } from 'tests/engine/mocks/aws';
import { AwsSecretsVaultAttributes, AwsSecretsVaultDeployableProvisionable, provisionCredentialResources } from '@stackmate/engine/providers/aws/services/secrets';

describe('AWS Secrets service', () => {
  const service = AwsSecretsVault;

  it('is a valid AWS secrets service', () => {
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
      },
    });
  });

  describe('credentials resources registrations', () => {
    let stack: Stack;
    let provisionable: Provisionable;
    let config: AwsSecretsVaultAttributes;

    beforeEach(() => {
      stack = getStack('my-project', 'my-stage');

      config = {
        provider: PROVIDER.AWS,
        name: 'aws-secrets-service',
        type: SERVICE_TYPE.SECRETS,
        region: DEFAULT_REGION,
      };

      provisionable = getAwsDeploymentProvisionableMock(config, stack);
    });

    it('registers the provision credentials terraform resources', () => {
      const resources = provisionCredentialResources(
        provisionable as AwsSecretsVaultDeployableProvisionable, stack,
      );
      expect(resources).toBeInstanceOf(Object);
      expect(resources.data).toBeInstanceOf(DataAwsSecretsmanagerSecretVersion)
      expect(resources.version).toBeInstanceOf(SecretsmanagerSecretVersion);
      expect(resources.secret).toBeInstanceOf(SecretsmanagerSecret);
      expect(resources.password).toBeInstanceOf(DataAwsSecretsmanagerRandomPassword);
    });

    it('returns the credentials as an object when calling the credentials method', () => {
      const credentials = service.credentials(provisionable, stack);
      expect(credentials).toBeInstanceOf(Object);
      const reg = /\${TfToken\[TOKEN.(\d+)\]}/gi;
      expect(credentials.username).toEqual(expect.stringMatching(reg));
      expect(credentials.password).toEqual(expect.stringMatching(reg));
    });
  });
});
