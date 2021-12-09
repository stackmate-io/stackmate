import { InternetGateway, Subnet, Vpc } from '@cdktf/provider-aws';
import { Token } from 'cdktf';

import { PROVIDER, SERVICE_TYPE } from '@stackmate/constants';
import { ProviderChoice, RegionList, ServiceTypeChoice } from '@stackmate/types';
import Service from '@stackmate/core/service';
import { AWS_REGIONS } from '../constants';

class AwsVpcService extends Service {
  readonly type: ServiceTypeChoice = SERVICE_TYPE.NETWORKING;
  readonly provider: ProviderChoice = PROVIDER.AWS;
  readonly regions: RegionList = AWS_REGIONS;

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
