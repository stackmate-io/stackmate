import { get } from 'lodash';
import { Construct } from 'constructs';

import { PROVIDER } from '@stackmate/constants';
import { CloudProvider } from '@stackmate/interfaces';
import { ProjectDefaults, ProviderChoice } from '@stackmate/types';
import { AwsCloud } from '@stackmate/clouds/aws';
import { Cached } from '@stackmate/lib/decorators';

class CloudManager {
  /**
   * @var {Stack} stack the stack to use for cloud provisions
   */
  readonly stack: Construct;

  /**
   * @var {Object} defaults any project defaults to use in cloud providers
   */
  readonly defaults: ProjectDefaults = {};

  constructor(stack: Construct, defaults: ProjectDefaults = {}) {
    this.stack = stack;
    this.defaults = defaults;
  }

  /**
   * Returns a cloud manager based on a provider name and region
   *
   * @param {ProviderChoice} provider string the provider for the cloud manager
   * @param {String} region string the cloud region to use
   * @returns {CloudProvider} the cloud manager for the specified provider & region
   */
  @Cached()
  get(provider: ProviderChoice, region: string): CloudProvider {
    let cloud;

    if (provider === PROVIDER.AWS) {
      cloud = new AwsCloud(this.stack, get(this.defaults, provider));
    }

    if (!cloud) {
      throw new Error(`Provider ${provider} is not supported, yet`);
    }

    cloud.region = region;
    cloud.init();

    return cloud;
  }
}

export default CloudManager;
