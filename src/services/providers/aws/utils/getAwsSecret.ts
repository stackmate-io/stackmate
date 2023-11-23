import crypto from 'node:crypto'
import {
  dataAwsSecretsmanagerRandomPassword,
  secretsmanagerSecret,
  secretsmanagerSecretVersion,
} from '@cdktf/provider-aws'
import { Fn, TerraformLocal, Token } from 'cdktf'
import { isNumber, isString, merge, uniq } from 'lodash'
import { DEFAULT_PASSWORD_LENGTH, isTestMode } from '@src/constants'
import type { kmsKey } from '@cdktf/provider-aws'
import type { Stack } from '@src/lib/stack'
import type { OneOfType } from '@src/lib/util'

type SecretGenerationOptions = {
  length?: number
  exclude?: string[]
}

export const getSecret = (
  secretName: string,
  stack: Stack,
  kmsKey?: kmsKey.KmsKey,
  opts?: OneOfType<[{ value: string }, SecretGenerationOptions]>,
): {
  secret: secretsmanagerSecret.SecretsmanagerSecret
  version: secretsmanagerSecretVersion.SecretsmanagerSecretVersion
  value: TerraformLocal
} => {
  const resourceId = `secret_${secretName}_${crypto.randomBytes(8).toString('hex')}`

  let value: TerraformLocal

  if (opts?.value && isString(opts.value)) {
    value = new TerraformLocal(stack.context, `${resourceId}_secret_value`, opts.value)
  } else {
    const excludeCharacters = uniq(merge([], opts?.exclude || [], ['/', '\\', '@', ' ']))
    const passwordResource =
      new dataAwsSecretsmanagerRandomPassword.DataAwsSecretsmanagerRandomPassword(
        stack.context,
        `${resourceId}_secret_value`,
        {
          passwordLength: opts?.length || DEFAULT_PASSWORD_LENGTH,
          excludeCharacters: excludeCharacters.join(''),
          includeSpace: false,
          excludeNumbers: excludeCharacters.some(isNumber),
        },
      )

    value = new TerraformLocal(
      stack.context,
      `${resourceId}_secret_value`,
      passwordResource.randomPassword,
    )
  }

  const secret = new secretsmanagerSecret.SecretsmanagerSecret(
    stack.context,
    `${resourceId}_secret`,
    {
      name: secretName,
      kmsKeyId: kmsKey?.id,
      provider: kmsKey?.provider,
      recoveryWindowInDays: !isTestMode ? 30 : 0,
    },
  )

  const version = new secretsmanagerSecretVersion.SecretsmanagerSecretVersion(
    stack.context,
    `${resourceId}_secret_version`,
    {
      secretId: secret.id,
      secretString: Fn.jsonencode(Token.asString(value)),
      lifecycle: {
        ignoreChanges: ['secret_string'],
      },
    },
  )

  return {
    secret,
    version,
    value,
  }
}
