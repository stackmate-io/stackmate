import { PROVIDER } from '@stackmate/constants';
import { CloudProvider } from '@stackmate/interfaces';
import { CloudAttributes, ProviderChoice } from '@stackmate/types';
import { AwsCloud } from './aws';

const getCloudByProvider = (
  provider: ProviderChoice, attributes: CloudAttributes,
): CloudProvider => {
  let CloudClass;

  if (provider === PROVIDER.AWS) {
    CloudClass = AwsCloud;
  }

  if (!CloudClass) {
    throw new Error(`Provider ${provider} is not supported, yet`);
  }

  return CloudClass.factory(attributes);
};

export {
  AwsCloud,
  getCloudByProvider,
};
