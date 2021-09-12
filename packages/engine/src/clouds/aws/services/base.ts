import Service from 'core/service';
import { AwsVpcService } from 'clouds/aws/services/vpc';
import { ProviderChoice, RegionList } from 'types';
import { PROVIDER, AWS_REGIONS } from 'core/constants';

abstract class AwsService extends Service {
  readonly provider: ProviderChoice = PROVIDER.AWS;

  protected vpcId: string;

  readonly regions: RegionList = AWS_REGIONS;

  public set dependencies({ vpc }: { vpc: AwsVpcService }) {
    this.vpcId = vpc.id;
  }
}

export default AwsService;
