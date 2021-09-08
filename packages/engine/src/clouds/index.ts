import { PROVIDER } from 'core/constants';
import { ProviderChoice } from 'types';
import { AwsCloud } from 'clouds/aws';
import { ICloudManager, IStack } from 'interfaces';

export const getCloudManager = (provider: ProviderChoice, region: string, stack: IStack, defaults = {}): ICloudManager => {
  if (provider === PROVIDER.AWS) {
    return new AwsCloud(region, stack, defaults);
  }

  throw new Error(`Cloud Provider ${provider} is not supported, yet`);
};
