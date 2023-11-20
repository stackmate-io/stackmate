import { Fn, TerraformLocal } from 'cdktf'
import { snakeCase } from 'lodash'
import {
  dataAwsSecretsmanagerRandomPassword,
  secretsmanagerSecret,
  secretsmanagerSecretVersion,
} from '@cdktf/provider-aws'
import {
  withAssociations,
  withCredentialsGenerator,
  withHandler,
  withRegions,
} from '@services/behaviors'
import { extractTokenFromJsonString } from '@lib/terraform'
import { DEFAULT_PASSWORD_LENGTH, SERVICE_TYPE, PROVIDER, isTestMode } from '@src/constants'
import { getBaseService, getProfile } from '@services/utils'
import { pipe } from 'lodash/fp'
import { getProviderAssociations } from '@aws/utils/getProviderAssociations'
import { REGIONS } from '@aws/constants'
import type {
  CredentialsHandlerOptions,
  RegionalAttributes,
  SecretsVaultService,
} from '@services/behaviors'
import type { Stack } from '@lib/stack'
import type { Obj } from '@lib/util'
import type { AwsProviderAssociations } from '@aws/types'
import type {
  BaseServiceAttributes,
  BaseProvisionable,
  Provisionable,
  Credentials,
  Service,
} from '@services/types'

export type AwsSecretsVaultAttributes = BaseServiceAttributes &
  RegionalAttributes & {
    provider: typeof PROVIDER.AWS
    type: typeof SERVICE_TYPE.SECRETS
  }

export type AwsSecretsResources = Obj
export type AwsSecretsVaultService = SecretsVaultService<
  Service<AwsSecretsVaultAttributes, AwsProviderAssociations>
>
export type AwsSecretsProvisionable = Provisionable<AwsSecretsVaultService, AwsSecretsResources>

type ProvisionCredentialsResources = Credentials & {
  randomPassword: dataAwsSecretsmanagerRandomPassword.DataAwsSecretsmanagerRandomPassword
  secret: secretsmanagerSecret.SecretsmanagerSecret
  version: secretsmanagerSecretVersion.SecretsmanagerSecretVersion
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
    config: { name: targetName, type: targetType },
  } = target

  const {
    config,
    requirements: { kmsKey, providerInstance },
  } = vault

  const {
    root = false,
    length: passwordLength,
    exclude: excludeCharacters = ['/', '\\', '@', ' '],
  } = options
  const secretName = `${snakeCase(targetName)}_${targetType}_${root ? '_root_' : '_'}`
  const idPrefix = `${secretName}_secrets`
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
      description: `Secrets for the ${targetName} ${targetType} service`,
      kmsKeyId: kmsKey.id,
      provider: providerInstance,
      recoveryWindowInDays: !isTestMode ? secret.recoveryWindowInDays || 30 : 0,
      ...secret,
    },
  )

  const secretVersionResource = new secretsmanagerSecretVersion.SecretsmanagerSecretVersion(
    stack.context,
    `${idPrefix}_version`,
    {
      ...version,
      secretId: secretResource.id,
      secretString: Fn.jsonencode({
        username: `${snakeCase(targetName)}_${root ? 'root' : 'user'}`,
        password: passResource.randomPassword,
      }),
      lifecycle: {
        ignoreChanges: ['secret_string'],
      },
    },
  )

  const usernameLocal = new TerraformLocal(
    stack.context,
    `${idPrefix}_var_username`,
    extractTokenFromJsonString(secretVersionResource.secretString, 'username'),
  )

  const passwordLocal = new TerraformLocal(
    stack.context,
    `${idPrefix}_var_password`,
    extractTokenFromJsonString(secretVersionResource.secretString, 'password'),
  )

  return {
    username: usernameLocal,
    password: passwordLocal,
    randomPassword: passResource,
    secret: secretResource,
    version: secretVersionResource,
  }
}

/**
 * @returns {AwsSecretsVaultService} the secrets vault service
 */
export const getSecretsVaultService = (): AwsSecretsVaultService =>
  pipe(
    withHandler(() => ({})),
    withCredentialsGenerator(generateCredentials),
    withAssociations(getProviderAssociations()),
    withRegions(REGIONS),
    withAssociations(getProviderAssociations()),
  )(getBaseService(PROVIDER.AWS, SERVICE_TYPE.SECRETS))

export const AwsSecretsVault = getSecretsVaultService()
