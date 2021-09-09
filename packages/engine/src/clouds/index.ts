import { PROVIDER } from 'core/constants';
import { ProviderChoice } from 'types';
import { AwsCloud } from 'clouds/aws';
import { CloudManager, CloudStack } from 'interfaces';

export const getCloudManager = (provider: ProviderChoice, region: string, stack: CloudStack, defaults = {}): CloudManager => {
  if (provider === PROVIDER.AWS) {
    return new AwsCloud(region, stack, defaults);
  }

  throw new Error(`Cloud Provider ${provider} is not supported, yet`);
};
