import { Stack } from '@stackmate/engine/core/stack';
import { DEFAULT_REGION } from '@stackmate/engine/providers/aws/constants';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine';
import { getProvisionableFromConfig } from '@stackmate/engine/core/operation';
import { BaseServiceAttributes, CredentialsHandlerOptions, Provisionable } from '@stackmate/engine/core/service';
import { AwsProviderDeployableProvisionable, AwsProviderDeployableResources, onDeploy as providerDeployHandler } from '@stackmate/engine/providers/aws/services/provider';
import { AwsSecretsDeployableResources, AwsSecretsVaultDeployableProvisionable, provisionCredentialResources } from '@stackmate/engine/providers/aws/services/secrets';

export const getProviderResources = (stack: Stack): AwsProviderDeployableResources => {
  const provisionable = getProvisionableFromConfig({
    provider: PROVIDER.AWS,
    name: 'aws-provider-service',
    type: SERVICE_TYPE.PROVIDER,
    region: DEFAULT_REGION,
  }, stack.stageName);

  return providerDeployHandler(provisionable as AwsProviderDeployableProvisionable, stack);
};

export const getCredentialResources = (
  providerResources: AwsProviderDeployableResources,
  target: Provisionable,
  stack: Stack,
  opts?: CredentialsHandlerOptions,
): AwsSecretsDeployableResources => {
  const provisionable = getProvisionableFromConfig({
    provider: PROVIDER.AWS,
    name: 'aws-secrets-service',
    type: SERVICE_TYPE.SECRETS,
    region: DEFAULT_REGION,
  }, stack.stageName);

  Object.assign(provisionable, { requirements: providerResources });

  return provisionCredentialResources(
    provisionable as AwsSecretsVaultDeployableProvisionable, target, stack, opts,
  );
}

export const getAwsDeploymentProvisionableMock = (
  config: BaseServiceAttributes,
  stack: Stack,
  { withCredentials = false, withRootCredentials = false } = {},
): Provisionable => {
  const provisionable = getProvisionableFromConfig(config, stack.stageName);
  const providerResources = getProviderResources(stack);

  Object.assign(provisionable, {
    requirements: {
      ...providerResources,
      ...(withCredentials
        ? { credentials: getCredentialResources(providerResources, provisionable, stack) }
        : {}
      ),
      ...(withRootCredentials
        ? { rootCredentials: getCredentialResources(providerResources, provisionable, stack, { root: true }) }
        : {}
      ),
    },
  });

  return provisionable;
};
