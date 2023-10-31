import { Stack } from '@core/stack';
import { DEFAULT_REGION } from '@providers/aws/constants';
import { PROVIDER, SERVICE_TYPE } from '@constants';
import { getProvisionable } from '@core/operation';
import { BaseProvisionable, BaseServiceAttributes, CredentialsHandlerOptions } from '@core/service';
import { AwsProviderDeployableProvisionable, AwsProviderDeployableResources, onDeploy as providerDeployHandler } from '@providers/aws/services/provider';
import { AwsSecretsDeployableResources, AwsSecretsVaultDeployableProvisionable, generateCredentials } from '@providers/aws/services/secrets';

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