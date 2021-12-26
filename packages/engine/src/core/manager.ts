import { get } from 'lodash';
import { Memoize } from 'typescript-memoize';

import { PROVIDER } from '@stackmate/constants';
import { CloudProvider, CloudStack } from '@stackmate/interfaces';
import { ProjectDefaults, ProviderChoice } from '@stackmate/types';
import { AwsCloud } from '@stackmate/clouds/aws';

class CloudManager {
  /**
   * @var {Stack} stack the stack to use for cloud provisions
   */
  readonly stack: CloudStack;

  /**
   * @var {Object} defaults any project defaults to use in cloud providers
   */
  readonly defaults: ProjectDefaults = {};

  /**
   * @constructor
   * @param {CloudStack} stack the stack to use for provisioning
   * @param {Object} defaults the cloud's defaults
   */
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
  @Memoize((...args: any[]) => args.join(':'))
  get(provider: ProviderChoice, region: string): CloudProvider {
    let CloudClass;

    if (provider === PROVIDER.AWS) {
      CloudClass = AwsCloud;
    }

    if (!CloudClass) {
      throw new Error(`Provider ${provider} is not supported, yet`);
    }

    return CloudClass.factory(
      { region, defaults: get(this.defaults, provider, {}) }, this.stack,
    );
  }
}

export default CloudManager;
