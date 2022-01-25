import { PROVIDER } from '@stackmate/constants';
import { CloudProvider, CloudStack } from '@stackmate/interfaces';
import { CloudAttributes, ProviderChoice } from '@stackmate/types';
import { AwsCloud } from './aws';

const getCloudByProvider = (
  provider: ProviderChoice, stack: CloudStack, attributes: CloudAttributes,
): CloudProvider => {
  let CloudClass;

  if (provider === PROVIDER.AWS) {
    CloudClass = AwsCloud;
  }

  if (!CloudClass) {
    throw new Error(`Provider ${provider} is not supported, yet`);
  }

  return CloudClass.factory(attributes, stack);
};

export {
  AwsCloud,
  getCloudByProvider,
};
