import { Token } from 'cdktf';
import { InternetGateway, Subnet, Vpc } from '@cdktf/provider-aws/lib/vpc';

import { PROVIDER } from '@stackmate/constants';
import { AWS_REGIONS } from '@stackmate/clouds/aws/constants';
import { ProviderChoice, RegionList } from '@stackmate/types';
import Networking from '@stackmate/services/networking';

class AwsVpcService extends Networking {
  /**
   * @var {String} provider the cloud provider for this service
   */
  readonly provider: ProviderChoice = PROVIDER.AWS;

  /**
   * @var {RegionList} regions the regions that the service is available in
   */
  readonly regions: RegionList = AWS_REGIONS;

  /**
   * @var {Vpc} vpc the VPC resource
   * @protected
   */
  protected vpc: Vpc;

  /**
   * @var {Subnet} subnet the subnet resource
   * @protected
   */
  protected subnet: Subnet;

  /**
   * @var {InternetGateway} gateway the gateway resource
   * @protected
   */
  protected gateway: InternetGateway;

  /**
   * @returns {String} the vpc id
   */
  public get id(): string {
    return Token.asString(this.vpc.id);
  }

  provision() {
    // Add vpc, subnets etc
    this.vpc = new Vpc(this.stack, this.name, {
      cidrBlock: '10.0.0.0/16',
    });

    this.subnet = new Subnet(this.stack, `${this.name}-subnet`, {
      vpcId: this.id,
      cidrBlock: '10.0.0.0/24',
    });

    this.gateway = new InternetGateway(this.stack, `${this.name}-gateway`, {
      vpcId: this.id,
    });
  }
}

export default AwsVpcService;
