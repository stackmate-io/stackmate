import Service from 'core/service';
import { AwsVpcService } from 'clouds/aws/services/vpc';
import { ProviderChoice, ServiceAssociation } from 'types';
import { PROVIDER } from 'core/constants';

abstract class AwsService extends Service {
  readonly provider: ProviderChoice = PROVIDER.AWS;

  protected vpcId: string;

  public set dependencies({ vpc }: { vpc: AwsVpcService }) {
    this.vpcId = vpc.id;
  }
}

export default AwsService;
