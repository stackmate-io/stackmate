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
   * @var {Array<String>} regions the regions that the cloud is available in
   */
  readonly regions: RegionList = AWS_REGIONS;

  /**
   * @var {Object<[String]: Service>} serviceMapping the mapping from service name to constructor
   */
  readonly serviceMapping: ServiceMapping = AWS_SERVICE_MAPPING;

  /**
   * @var {Object} prerequisites the prerequisites for any service provisioned in this cloud
   */
  protected prerequisites: CloudPrerequisites;

  /**
   * Initializes the cloud provider
   * @void
   */
  init(): void {
    /* eslint-disable-next-line no-new */
    new AwsProvider(this.stack, PROVIDER.AWS, {
      region: this.region,
      defaultTags: {
        tags: {
          Environment: this.stack.name,
          Description: DEFAULT_RESOURCE_COMMENT,
        },
      },
    });

    const vpc = this.service(SERVICE_TYPE.NETWORKING).populate({
      name: 'my-vpc', region: this.region,
    });

    this.prerequisites = {
      vpc,
    };
  }
}

export {
  AwsCloud,
  AwsRdsService,
  AwsVpcService,
  AWS_SERVICE_MAPPING as AwsServiceMapping,
};
