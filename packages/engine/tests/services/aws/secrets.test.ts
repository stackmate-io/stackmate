import {
  DataAwsSecretsmanagerRandomPassword, DataAwsSecretsmanagerSecretVersion,
  SecretsmanagerSecret, SecretsmanagerSecretVersion,
} from '@cdktf/provider-aws/lib/secretsmanager';

import { AwsSecretsVault } from '@stackmate/engine/providers';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import { DEFAULT_REGION, REGIONS } from '@stackmate/engine/providers/aws/constants';
import { getStack, Stack } from '@stackmate/engine/core/stack';
import { getProvisionableFromConfig } from '@stackmate/engine/core/operation';
import { AwsProviderDeployableProvisionable, onDeployment } from '@stackmate/engine/providers/aws/services/provider';
import { AwsSecretsVaultDeployableProvisionable, provisionCredentialResources } from '@stackmate/engine/providers/aws/services/secrets';

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
        profile: { type: 'string', default: 'default', serviceProfile: true },
        overrides: { type: 'object', default: {}, serviceProfileOverrides: true }
      },
    });
  });

  describe('credentials resources registrations', () => {
    let stack: Stack;
    let provisionable: AwsSecretsVaultDeployableProvisionable;

    beforeEach(() => {
      const project = 'my-project';
      const stage = 'my-stage';
      stack = getStack(project, stage);

      provisionable = getProvisionableFromConfig({
        provider: PROVIDER.AWS,
        name: 'aws-secrets-service',
        type: SERVICE_TYPE.SECRETS,
        region: REGIONS[0],
      }, stage) as AwsSecretsVaultDeployableProvisionable;

      const awsProviderProvisionable = getProvisionableFromConfig({
        provider: PROVIDER.AWS,
        name: 'aws-provider-service',
        type: SERVICE_TYPE.PROVIDER,
        region: REGIONS[0],
      }, stage);

      // Assign the AWS provider requirements
      const awsProviderResources = onDeployment(
        awsProviderProvisionable as AwsProviderDeployableProvisionable, stack,
      );

      Object.assign(provisionable, {
        requirements: {
          kmsKey: awsProviderResources.kmsKey,
          providerInstance: awsProviderResources.provider,
        },
      });
    });

    it('registers the provision credentials terraform resources', () => {
      const resources = provisionCredentialResources(provisionable, stack);
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
