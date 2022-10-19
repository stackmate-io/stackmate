import { TerraformLocal } from 'cdktf';
import {
  dataAwsSecretsmanagerRandomPassword, dataAwsSecretsmanagerSecretVersion,
  secretsmanagerSecret, secretsmanagerSecretVersion,
} from '@cdktf/provider-aws';

import { AwsSecretsVault } from '@stackmate/engine/providers';
import { BaseProvisionable } from '@stackmate/engine/core/service';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import { DEFAULT_REGION, REGIONS } from '@stackmate/engine/providers/aws/constants';
import { getStack, Stack } from '@stackmate/engine/core/stack';
import { getAwsDeploymentProvisionableMock } from 'tests/engine/mocks/aws';
import { getProvisionableFromConfig } from '@stackmate/engine/core/operation';
import {
  AwsSecretsVaultAttributes, AwsSecretsVaultDeployableProvisionable, generateCredentials,
} from '@stackmate/engine/providers/aws/services/secrets';

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
      required: [],
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
    let vault: BaseProvisionable;
    let target: BaseProvisionable;
    let config: AwsSecretsVaultAttributes;

    beforeEach(() => {
      stack = getStack('my-project', 'my-stage');

      config = {
        provider: PROVIDER.AWS,
        name: 'aws-secrets-service',
        type: SERVICE_TYPE.SECRETS,
        region: DEFAULT_REGION,
      };

      const targetConfig = {
        provider: PROVIDER.AWS,
        name: 'aws-secrets-service',
        type: SERVICE_TYPE.SECRETS,
        region: DEFAULT_REGION,
      };

      vault = getAwsDeploymentProvisionableMock(config, stack);
      target = getProvisionableFromConfig(targetConfig, stack.stageName);
    });

    it('registers the provision credentials terraform resources', () => {
      const resources = generateCredentials(
        vault as AwsSecretsVaultDeployableProvisionable, target, stack,
      );
      expect(resources).toBeInstanceOf(Object);
      expect(resources.username).toBeInstanceOf(TerraformLocal);
      expect(resources.password).toBeInstanceOf(TerraformLocal);
      expect(resources.data).toBeInstanceOf(
        dataAwsSecretsmanagerSecretVersion.DataAwsSecretsmanagerSecretVersion,
      )
      expect(resources.version).toBeInstanceOf(
        secretsmanagerSecretVersion.SecretsmanagerSecretVersion,
      );
      expect(resources.secret).toBeInstanceOf(
        secretsmanagerSecret.SecretsmanagerSecret,
      );
      expect(resources.randomPassword).toBeInstanceOf(
        dataAwsSecretsmanagerRandomPassword.DataAwsSecretsmanagerRandomPassword,
      );
    });

    it('returns the credentials as an object when calling the credentials method', () => {
      const credentials = service.credentials(vault, target, stack);
      expect(credentials).toBeInstanceOf(Object);
      const reg = /\${TfToken\[TOKEN.(\d+)\]}/gi;
      expect(credentials.username.asString).toEqual(expect.stringMatching(reg));
      expect(credentials.password.asString).toEqual(expect.stringMatching(reg));
    });
  });
});
