import {
  DataAwsSecretsmanagerRandomPassword,
  SecretsmanagerSecretConfig,
  SecretsmanagerSecretVersionConfig,
} from '@cdktf/provider-aws/lib/secretsmanager';

const secret: Partial<SecretsmanagerSecretConfig> = {
  recoveryWindowInDays: 30,
};

const version: Partial<SecretsmanagerSecretVersionConfig> = {};

const password: Partial<DataAwsSecretsmanagerRandomPassword> = {
  includeSpace: false,
  excludeNumbers: false,
};

export {
  secret,
  version,
  password,
};
