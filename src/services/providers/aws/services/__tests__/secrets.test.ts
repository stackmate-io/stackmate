import { TerraformLocal } from 'cdktf'
import {
  dataAwsSecretsmanagerRandomPassword,
  dataAwsSecretsmanagerSecretVersion,
  secretsmanagerSecret,
  secretsmanagerSecretVersion,
} from '@cdktf/provider-aws'

import { AwsSecretsVault, generateCredentials } from '@aws/services/secrets'
import { PROVIDER, SERVICE_TYPE } from '@src/constants'
import { REGIONS } from '@aws/constants'
import { Stack } from '@lib/stack'
import { Registry } from '@services/registry'
import { getAwsProvisionable } from '@tests/mocks'
import type { BaseProvisionable } from '@services/types/provisionable'
import type { AwsSecretsProvisionable, AwsSecretsVaultAttributes } from '@aws/services/secrets'

describe('AWS Secrets service', () => {
  const service = AwsSecretsVault

  it('is a valid AWS secrets service', () => {
    expect(service.provider).toEqual(PROVIDER.AWS)
    expect(service.type).toEqual(SERVICE_TYPE.SECRETS)
  })

  it('has the AWS regions set', () => {
    expect(service.regions).toEqual(expect.arrayContaining(REGIONS))
  })

  it('contains a valid schema', () => {
    expect(service.schema).toMatchObject({
      $id: 'services/aws/secrets',
      type: 'object',
      required: expect.arrayContaining(['name', 'provider', 'type']),
      additionalProperties: false,
      properties: {
        provider: expect.objectContaining({ const: PROVIDER.AWS }),
        type: expect.objectContaining({ const: SERVICE_TYPE.SECRETS }),
        region: expect.objectContaining({ type: 'string', enum: expect.arrayContaining(REGIONS) }),
      },
    })
  })

  describe('credentials resources registrations', () => {
    let stack: Stack
    let target: BaseProvisionable
    let vault: AwsSecretsProvisionable
    let config: AwsSecretsVaultAttributes

    beforeEach(() => {
      stack = new Stack('stack-name')

      config = {
        provider: PROVIDER.AWS,
        name: 'aws-secrets-service',
        type: SERVICE_TYPE.SECRETS,
        region: 'eu-central-1',
      }

      const targetConfig = {
        provider: PROVIDER.AWS,
        name: 'aws-secrets-service',
        type: SERVICE_TYPE.SECRETS,
        region: 'eu-central-1',
      }

      vault = getAwsProvisionable(config, stack)
      target = Registry.provisionable(targetConfig)
    })

    it('registers the provision credentials terraform resources', () => {
      const resources = generateCredentials(vault, stack, target)
      expect(resources).toBeInstanceOf(Object)
      expect(resources.username).toBeInstanceOf(TerraformLocal)
      expect(resources.password).toBeInstanceOf(TerraformLocal)
      expect(resources.data).toBeInstanceOf(
        dataAwsSecretsmanagerSecretVersion.DataAwsSecretsmanagerSecretVersion,
      )
      expect(resources.version).toBeInstanceOf(
        secretsmanagerSecretVersion.SecretsmanagerSecretVersion,
      )
      expect(resources.secret).toBeInstanceOf(secretsmanagerSecret.SecretsmanagerSecret)
      expect(resources.randomPassword).toBeInstanceOf(
        dataAwsSecretsmanagerRandomPassword.DataAwsSecretsmanagerRandomPassword,
      )
    })

    it('returns the credentials as an object when calling the credentials method', () => {
      const credentials = service.credentials(vault, stack, target)
      expect(credentials).toBeInstanceOf(Object)
      const reg = /\${TfToken\[TOKEN.(\d+)\]}/gi
      expect(credentials.username.asString).toEqual(expect.stringMatching(reg))
      expect(credentials.password.asString).toEqual(expect.stringMatching(reg))
    })
  })
})
