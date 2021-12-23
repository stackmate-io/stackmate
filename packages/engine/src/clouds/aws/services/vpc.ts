import { Token } from 'cdktf';
import { isUndefined } from 'lodash';
import { InternetGateway, Subnet, Vpc } from '@cdktf/provider-aws/lib/vpc';

import Networking from '@stackmate/services/networking';
import AwsService from '@stackmate/lib/mixins';

const AwsNetworking = AwsService(Networking);

class AwsVpcService extends AwsNetworking {
  /**
   * @var {Vpc} vpc the VPC resource
   */
  public vpc: Vpc;

  /**
   * @var {Subnet} subnet the subnet resource
   */
  public subnet: Subnet;

  /**
   * @var {InternetGateway} gateway the gateway resource
   */
  public gateway: InternetGateway;

  /**
   * @returns {Boolean} whether the service is provisioned
   */
  public get isProvisioned(): boolean {
    return !isUndefined(this.vpc) && !isUndefined(this.subnet) && !isUndefined(this.gateway);
  }

  /**
   * @returns {String} the vpc id
   */
  public get id(): string {
    return Token.asString(this.vpc.id);
  }

  provision() {
    // Add vpc, subnets etc
    this.vpc = new Vpc(this.stack, this.identifier, {
      cidrBlock: '10.0.0.0/16',
    });

    this.subnet = new Subnet(this.stack, `${this.identifier}-subnet`, {
      vpcId: this.id,
      cidrBlock: '10.0.0.0/24',
    });

    this.gateway = new InternetGateway(this.stack, `${this.identifier}-gateway`, {
      vpcId: this.id,
    });
  }
}

export default AwsVpcService;
