import { InternetGateway, Subnet, Vpc } from '@cdktf/provider-aws';
import { Token } from 'cdktf';
import { SERVICE_TYPE } from 'core/constants';
import AwsService from 'clouds/aws/services/base';
import { ServiceTypeChoice } from 'types';

class AwsVpcService extends AwsService {
  readonly type: ServiceTypeChoice = SERVICE_TYPE.NETWORKING;

  protected vpc: Vpc;

  protected subnet: Subnet;

  /**
   * @var {InternetGateway}
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

export { AwsVpcService };
