import { Memoize } from 'typescript-memoize';
import { AwsProvider } from '@cdktf/provider-aws';

import Cloud from '@stackmate/core/cloud';
import AwsVpcService from '@stackmate/providers/aws/services/vpc';
import AwsRdsService from '@stackmate/providers/aws/services/rds';
import { PROVIDER } from '@stackmate/constants';
import { AWS_REGIONS } from '@stackmate/providers/aws/constants';
import { ProviderChoice, RegionList, ServiceAttributes } from '@stackmate/types';
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
   * @returns {Array<ServiceAttributes>} the cloud's prerequisites for the services to be deployed
   */
  @Memoize() prerequisites(): ServiceAttributes[] {
    return [];
  }
}

export {
  AwsCloud,
  AwsRdsService,
  AwsVpcService,
};
