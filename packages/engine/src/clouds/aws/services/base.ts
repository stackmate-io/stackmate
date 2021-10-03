import Service from '@stackmate/core/service';
import { AwsVpcService } from '@stackmate/clouds/aws/services/vpc';
import { ProviderChoice, RegionList } from '@stackmate/types';
import { PROVIDER } from '@stackmate/core/constants';
import { AWS_REGIONS } from '@stackmate/clouds/aws/constants';

abstract class AwsService extends Service {
  /**
   * @var {String} provider the cloud provider used (eg. AWS)
   * @readonly
   */
  readonly provider: ProviderChoice = PROVIDER.AWS;

  /**
   * @var {Object} regions the list of regions available
   * @readonly
   */
  readonly regions: RegionList = AWS_REGIONS;

  /**
   * @var {String} vpcId the vpc id to use in the resources
   * @protected
   */
  protected vpcId: string;

  public set dependencies({ vpc }: { vpc: AwsVpcService }) {
    this.vpcId = vpc.id;
  }
}

export default AwsService;
