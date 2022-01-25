import { Memoize } from 'typescript-memoize';
import { AwsProvider } from '@cdktf/provider-aws';

import Cloud from '@stackmate/core/cloud';
import { DEFAULT_RESOURCE_COMMENT, PROVIDER, SERVICE_TYPE } from '@stackmate/constants';
import { AWS_REGIONS } from '@stackmate/clouds/aws/constants';
import { CloudPrerequisites, ProviderChoice, RegionList, ServiceMapping } from '@stackmate/types';
import AwsVpcService from '@stackmate/clouds/aws/services/vpc';
import AwsRdsService from '@stackmate/clouds/aws/services/rds';

export const AWS_SERVICE_MAPPING: ServiceMapping = {
  [SERVICE_TYPE.DATABASE]: AwsRdsService,
  [SERVICE_TYPE.NETWORKING]: AwsVpcService,
};

class AwsCloud extends Cloud {
  /**
   * @var {String} provider the provider's name
   * @readonly
   */
  readonly provider: ProviderChoice = PROVIDER.AWS;

  /**
   * @var {Array<String>} availableRegions the regions that the cloud is available in
   */
  readonly availableRegions: RegionList = AWS_REGIONS;

  /**
   * @var {Object<[String]: Service>} serviceMapping the mapping from service name to constructor
   */
  readonly serviceMapping: ServiceMapping = AWS_SERVICE_MAPPING;

  /**
   * @var {Array<AwsProvider>} providerInstances The array of provider instances after bootstrapping
   */
  protected providerInstances: Array<AwsProvider>

  /**
   * Registers the cloud provider to the stack
   */
  bootstrap(): void {
    this.aliases.forEach((alias, region) => {
      const instance = new AwsProvider(this.stack, this.provider, {
        region,
        alias,
        defaultTags: {
          tags: {
            Environment: this.stack.name,
            Description: DEFAULT_RESOURCE_COMMENT,
          },
        },
      });

      this.providerInstances.push(instance);
    });
  }

  /**
   * @returns {CloudPrerequisites} the cloud's prerequisites for the services to be deployed
   */
  @Memoize() prerequisites(): CloudPrerequisites {
    return {
      vpc: this.introduce({
        type: SERVICE_TYPE.NETWORKING,
        name: `${this.stack.name}-vpc`,
        region: this.defaultRegion,
      }),
    };
  }
}

export {
  AwsCloud,
  AwsRdsService,
  AwsVpcService,
  AWS_SERVICE_MAPPING as AwsServiceMapping,
};
