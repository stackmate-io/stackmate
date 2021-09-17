import { get, has, set } from 'lodash';

import { PROVIDER } from '@stackmate/core/constants';
import { CloudProvider, CloudStack } from '@stackmate/interfaces';
import { ProjectDefaults, ProviderChoice } from '@stackmate/types';
import { AwsCloud } from '@stackmate/clouds/aws';

class CloudManager {
  /**
   * @var {Map} _clouds a collection of the cloud managers that have been instantiated for the stage
   * @private
   */
  private _clouds: { [name: string]: CloudProvider } = {};

  /**
   * @var {Stack} stack the stack to use for cloud provisions
   */
  readonly stack: CloudStack;

  /**
   * @var {Object} defaults any project defaults to use in cloud providers
   */
  readonly defaults: ProjectDefaults = {};

  constructor(stack: CloudStack, defaults: ProjectDefaults = {}) {
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
  get(provider: ProviderChoice, region: string): CloudProvider {
    const key = `${provider}-${region}`;

    if (!has(this._clouds, key)) {
      set(this._clouds, key, this.instantiate(provider, region));
    }

    return get(this._clouds, key);
  }

  /**
   * Instantiate a cloud provider based on its name and region
   *
   * @param {String} provider the provider to instantiate (eg. 'aws')
   * @param {String} region the region for the provider
   * @returns {CloudProvider} the cloud provider instantiated
   */
  protected instantiate(provider: ProviderChoice, region: string): CloudProvider {
    if (provider === PROVIDER.AWS) {
      return new AwsCloud(region, this.stack, get(this.defaults, provider));
    }

    throw new Error(`Provider ${provider} is not supported, yet`);
  }
}

export default CloudManager;
