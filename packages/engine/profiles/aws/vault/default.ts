import { SecretsmanagerSecretConfig, SecretsmanagerSecretVersionConfig } from '@cdktf/provider-aws/lib/secretsmanager';

const secret: Partial<SecretsmanagerSecretConfig> = {
  recoveryWindowInDays: 30,
};

const version: Partial<SecretsmanagerSecretVersionConfig> = {};

export {
  secret,
  version,
};
