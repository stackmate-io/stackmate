import type {
  dataAwsSecretsmanagerRandomPassword,
  secretsmanagerSecret,
  secretsmanagerSecretVersion,
} from '@cdktf/provider-aws'

const secret: Partial<secretsmanagerSecret.SecretsmanagerSecretConfig> = {
  recoveryWindowInDays: 30,
}

const version: Partial<secretsmanagerSecretVersion.SecretsmanagerSecretVersionConfig> = {}

const password: Partial<dataAwsSecretsmanagerRandomPassword.DataAwsSecretsmanagerRandomPassword> = {
  includeSpace: false,
  excludeNumbers: false,
}

export { secret, version, password }
