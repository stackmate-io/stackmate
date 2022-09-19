import {
  DataAwsSecretsmanagerSecretVersion,
  SecretsmanagerSecret,
  SecretsmanagerSecretVersion,
} from '@cdktf/provider-aws/lib/secretsmanager';

export type AwsSecretsDeployableResources = {};
export type AwsSecretsDestroyableResources = {};
export type AwsSecretsPreparableResources = {};

export type AwsSecretsLinkableResources = {
  secret: SecretsmanagerSecret,
  version: SecretsmanagerSecretVersion,
  data: DataAwsSecretsmanagerSecretVersion,
  username: string;
  password: string;
};
