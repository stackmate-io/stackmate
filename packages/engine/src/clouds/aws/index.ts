import { Memoize } from 'typescript-memoize';
import { AwsProvider } from '@cdktf/provider-aws';

import Cloud from '@stackmate/core/cloud';
import AwsVpcService from '@stackmate/clouds/aws/services/vpc';
import AwsRdsService from '@stackmate/clouds/aws/services/rds';
import { DEFAULT_RESOURCE_COMMENT, PROVIDER } from '@stackmate/constants';
import { AWS_REGIONS } from '@stackmate/clouds/aws/constants';
import { CloudPrerequisites, ProviderChoice, RegionList } from '@stackmate/types';
import { CloudStack } from '@stackmate/interfaces';
import { RegisterCloud } from '@stackmate/lib/decorators';

@RegisterCloud(PROVIDER.AWS) class AwsCloud extends Cloud {
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
   * @var {Array<AwsProvider>} providerInstances The array of provider instances after bootstrapping
   */
  protected providerInstances: Array<AwsProvider>

  /**
   * Registers the cloud provider to the stack
   */
  provision(stack: CloudStack): void {
    this.aliases.forEach((alias, region) => {
      const instance = new AwsProvider(stack, this.provider, {
        region,
        alias,
        defaultTags: {
          tags: {
            Environment: stack.name,
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
      // vpc: this.introduce({
      //   type: SERVICE_TYPE.NETWORKING,
      //   name: `${this.stack.name}-vpc`,
      //   region: this.defaultRegion,
      // }),
    };
  }
}

export {
  AwsCloud,
  AwsRdsService,
  AwsVpcService,
};
