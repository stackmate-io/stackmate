import { Stack } from '@stackmate/engine/core/stack';
import { DEFAULT_REGION } from '@stackmate/engine/providers/aws/constants';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine';
import { getProvisionable } from '@stackmate/engine/core/operation';
import { BaseProvisionable, BaseServiceAttributes, CredentialsHandlerOptions } from '@stackmate/engine/core/service';
import { AwsProviderDeployableProvisionable, AwsProviderDeployableResources, onDeploy as providerDeployHandler } from '@stackmate/engine/providers/aws/services/provider';
import { AwsSecretsDeployableResources, AwsSecretsVaultDeployableProvisionable, generateCredentials } from '@stackmate/engine/providers/aws/services/secrets';

export const getProviderResources = (stack: Stack): AwsProviderDeployableResources => {
  const provisionable = getProvisionable({
    provider: PROVIDER.AWS,
    name: 'aws-provider-service',
    type: SERVICE_TYPE.PROVIDER,
    region: DEFAULT_REGION,
  });

  return providerDeployHandler(provisionable as AwsProviderDeployableProvisionable, stack);
};

export const getCredentialResources = (
  providerResources: AwsProviderDeployableResources,
  target: BaseProvisionable,
  stack: Stack,
  opts?: CredentialsHandlerOptions,
): AwsSecretsDeployableResources => {
  const provisionable = getProvisionable({
    provider: PROVIDER.AWS,
    name: 'aws-secrets-service',
    type: SERVICE_TYPE.SECRETS,
    region: DEFAULT_REGION,
  });

  Object.assign(provisionable, { requirements: providerResources });

  return generateCredentials(
    provisionable as AwsSecretsVaultDeployableProvisionable, stack, target, opts,
  );
}

export const getAwsDeploymentProvisionableMock = <P extends BaseProvisionable>(
  config: BaseServiceAttributes,
  stack: Stack,
  { withCredentials = false, withRootCredentials = false } = {},
): P => {
  const provisionable = getProvisionable(config);
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

  return provisionable as P;
};
