import { Token } from 'cdktf';
import { isEmpty, isUndefined } from 'lodash';
import { InternetGateway, Subnet, Vpc } from '@cdktf/provider-aws/lib/vpc';

import Networking from '@stackmate/services/networking';
import { getNetworkingCidrBlocks } from '@stackmate/lib/helpers';
import { ProviderChoice, RegionList } from '@stackmate/types';
import { PROVIDER } from '@stackmate/constants';
import { AWS_REGIONS } from '@stackmate/clouds/aws/constants';
import { CloudStack } from '@stackmate/interfaces';

/**
 * We don't wrap the service with the AwsService mixin
 * because this is a service that gets instantiated when the cloud provider inits
 */
class AwsVpcService extends Networking {
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
   * @var {Vpc} vpc the VPC resource
   */
  public vpc: Vpc;

  /**
   * @var {Array<Subnet>} subnetPrimary the subnet resource
   */
  public subnets: Array<Subnet> = [];

  /**
   * @var {InternetGateway} gateway the gateway resource
   */
  public gateway: InternetGateway;

  /**
   * @returns {Boolean} whether the service is registered into the stack
   */
  public get isRegistered(): boolean {
    return !isUndefined(this.vpc)
      && !isUndefined(this.subnets)
      && !isEmpty(this.subnets)
      && !isUndefined(this.gateway);
  }

  /**
   * @returns {String} the vpc id
   */
  public get id(): string {
    return Token.asString(this.vpc.id);
  }

  /**
   * @returns {String} the security group id
   */
  public get securityGroupId(): string {
    return Token.asString(this.vpc.defaultSecurityGroupId);
  }

  provision(stack: CloudStack) {
    const { vpc, subnet, gateway } = this.resourceProfile;
    const [vpcCidr, ...subnetCidrs] = getNetworkingCidrBlocks(this.ip, 16, 2, 24);

    this.vpc = new Vpc(stack, this.identifier, {
      ...vpc,
      cidrBlock: vpcCidr,
    });

    this.subnets = subnetCidrs.map((cidrBlock, idx) => (
      new Subnet(stack, `${this.identifier}-subnet${(idx + 1)}`, {
        ...subnet,
        vpcId: this.vpc.id,
        cidrBlock,
      })
    ));

    this.gateway = new InternetGateway(stack, `${this.identifier}-gateway`, {
      ...gateway,
      vpcId: this.vpc.id,
    });
  }
}

export default AwsVpcService;
