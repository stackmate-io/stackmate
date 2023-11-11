import { TerraformLocal } from 'cdktf'
import { kebabCase, snakeCase } from 'lodash'
import {
  dataAwsSecretsmanagerRandomPassword,
  dataAwsSecretsmanagerSecretVersion,
  secretsmanagerSecret,
  secretsmanagerSecretVersion,
} from '@cdktf/provider-aws'
import { withCredentialsGenerator, withHandler } from '@services/behaviors'
import { extractTokenFromJsonString } from '@lib/terraform'
import { DEFAULT_PASSWORD_LENGTH, SERVICE_TYPE } from '@src/constants'
import { getProfile } from '@services/utils'
import { getAwsService } from '@aws/utils/getAwsService'
import { pipe } from 'lodash/fp'
import type { PROVIDER } from '@src/constants'
import type { CredentialsHandlerOptions, SecretsVaultService } from '@services/behaviors'
import type { Stack } from '@lib/stack'
import type { Obj } from '@lib/util'
import type { AwsService } from '@aws/types'
import type {
  BaseServiceAttributes,
  BaseProvisionable,
  Provisionable,
  Credentials,
} from '@services/types'

export type AwsSecretsVaultAttributes = BaseServiceAttributes & {
  provider: typeof PROVIDER.AWS
  type: typeof SERVICE_TYPE.SECRETS
  region: string
}

export type AwsSecretsResources = Obj
export type AwsSecretsVaultService = SecretsVaultService<AwsService<AwsSecretsVaultAttributes>>
export type AwsSecretsProvisionable = Provisionable<AwsSecretsVaultService, AwsSecretsResources>

type ProvisionCredentialsResources = Credentials & {
  randomPassword: dataAwsSecretsmanagerRandomPassword.DataAwsSecretsmanagerRandomPassword
  secret: secretsmanagerSecret.SecretsmanagerSecret
  version: secretsmanagerSecretVersion.SecretsmanagerSecretVersion
  data: dataAwsSecretsmanagerSecretVersion.DataAwsSecretsmanagerSecretVersion
}

/**
 * @param {AwsSecretsProvisionable} provisionable the vault's provisionable
 * @param {Stack} stack the stack to deploy resources on
 * @param {CredentialsHandlerOptions} opts the credential handler's options
 * @returns {ProvisionCredentialsResources} the credentials objects
 */
export const generateCredentials = (
  vault: AwsSecretsProvisionable,
  stack: Stack,
  target: BaseProvisionable,
  options: CredentialsHandlerOptions = {},
): ProvisionCredentialsResources => {
  const {
    config: { name: targetName },
  } = target

  const {
    service,
    config,
    requirements: { kmsKey, providerInstance },
  } = vault

  const { root = false, length: passwordLength, exclude: excludeCharacters = [] } = options
  const idPrefix = `${snakeCase(targetName)}_secrets`
  const secretName = `${stack.name}/${kebabCase(targetName.toLowerCase())}`
  const { secret, version, password } = getProfile(config)

  const passResource = new dataAwsSecretsmanagerRandomPassword.DataAwsSecretsmanagerRandomPassword(
    stack.context,
    `${idPrefix}_password`,
    {
      passwordLength: passwordLength || DEFAULT_PASSWORD_LENGTH,
      excludeCharacters: excludeCharacters.join(''),
      ...password,
    },
  )

  const secretResource = new secretsmanagerSecret.SecretsmanagerSecret(
    stack.context,
    `${idPrefix}_secret`,
    {
      name: secretName,
      description: `Secrets for the ${service} service`,
      kmsKeyId: kmsKey.id,
      provider: providerInstance,
      ...secret,
    },
  )

  const secretVersionResource = new secretsmanagerSecretVersion.SecretsmanagerSecretVersion(
    stack.context,
    `${idPrefix}_version`,
    {
      ...version,
      secretId: secretResource.id,
      secretString: JSON.stringify({
        username: `${snakeCase(targetName)}_${root ? 'root' : 'user'}`,
        password: passResource.randomPassword,
      }),
      lifecycle: {
        ignoreChanges: ['secret_string'],
      },
    },
  )

  const data = new dataAwsSecretsmanagerSecretVersion.DataAwsSecretsmanagerSecretVersion(
    stack.context,
    `${idPrefix}_data`,
    {
      secretId: secretResource.id,
      versionId: secretVersionResource.id,
    },
  )

  const usernameLocal = new TerraformLocal(
    stack.context,
    `${idPrefix}_var_username`,
    extractTokenFromJsonString(data.secretString, 'username'),
  )

  const passwordLocal = new TerraformLocal(
    stack.context,
    `${idPrefix}_var_password`,
    extractTokenFromJsonString(data.secretString, 'password'),
  )

  return {
    username: usernameLocal,
    password: passwordLocal,
    randomPassword: passResource,
    secret: secretResource,
    version: secretVersionResource,
    data,
  }
}

/**
 * @returns {AwsSecretsVaultService} the secrets vault service
 */
export const getSecretsVaultService = (): AwsSecretsVaultService =>
  pipe(
    withHandler(() => ({})),
    withCredentialsGenerator(generateCredentials),
  )(getAwsService(SERVICE_TYPE.SECRETS))

export const AwsSecretsVault = getSecretsVaultService()