import {
  DataAwsSecretsmanagerSecretVersion,
  SecretsmanagerSecret,
  SecretsmanagerSecretVersion,
} from '@cdktf/provider-aws/lib/secretsmanager';

export type AwsSecretsDeployableProvisions = {};
export type AwsSecretsDestroyableProvisions = {};
export type AwsSecretsPreparableProvisions = {};

export type AwsSecretsLinkableProvisons = {
  secret: SecretsmanagerSecret,
  version: SecretsmanagerSecretVersion,
  data: DataAwsSecretsmanagerSecretVersion,
  username: string;
  password: string;
};
