import Service from '@stackmate/core/service';
import { AwsVpcService } from '@stackmate/clouds/aws/services/vpc';
import { ProviderChoice, RegionList } from '@stackmate/types';
import { PROVIDER, AWS_REGIONS } from '@stackmate/core/constants';

abstract class AwsService extends Service {
  readonly provider: ProviderChoice = PROVIDER.AWS;

  protected vpcId: string;

  readonly regions: RegionList = AWS_REGIONS;

  public set dependencies({ vpc }: { vpc: AwsVpcService }) {
    this.vpcId = vpc.id;
  }
}

export default AwsService;
