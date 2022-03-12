import { InternetGateway, Subnet, Vpc } from '@cdktf/provider-aws/lib/vpc';
import { AwsProvider as TerraformAwsProvider } from '@cdktf/provider-aws';
import { KmsKey } from '@cdktf/provider-aws/lib/kms';

import Parser from '@stackmate/lib/parsers';
import Provider from '@stackmate/core/services/provider';
import { CloudStack } from '@stackmate/interfaces';
import { AWS_REGIONS } from '@stackmate/providers/aws/constants';
import { Attribute } from '@stackmate/lib/decorators';
import { DEFAULT_IP, DEFAULT_RESOURCE_COMMENT, PROVIDER } from '@stackmate/constants';
import { ProviderChoice, RegionList } from '@stackmate/types';
import { getNetworkingCidrBlocks } from '@stackmate/lib/helpers';

class AwsProvider extends Provider {
  /**
   * @var {String} ip the CIDR block to use as a base for the service
   */
  @Attribute ip: string = DEFAULT_IP;

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
   * @var {Vpc} vpc the VPC to deploy the resources in
   */
  vpc: Vpc;

  /**
   * @var {Subnet[]} subnets the list of subnets to use
   */
  subnets: Subnet[];

  /**
   * @var {InternetGateway} gateway the internet gateway to use
   */
  gateway: InternetGateway;

  /**
   * @var {KmsKey} key the KMS key to use across the stack
   */
  key: KmsKey;

  /**
   * @returns {Object} the parser functions to apply to the service's attributes
   */
  parsers() {
    return {
      ...super.parsers(),
      ip: Parser.parseString,
    };
  }

  /**
   * @returns {Validations} the validations for the service
   */
  validations() {
    return {
      ...super.validations(),
      ip: {
        presence: {
          allowEmpty: false,
          message: 'You should define an IP to use as a CIDR block for the networking',
        },
        format: {
          pattern: '^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$',
          message: 'Please provide a valid IPv4 IP for the networking service',
        }
      },
    };
  }

  /**
   * Registers the provider's resource to the stack
   *
   * @param {CloudStack} stack the stack to register the provider to
   */
  bootstrap(stack: CloudStack): void {
    this.resource = new TerraformAwsProvider(stack, this.provider, {
      region: this.region,
      alias: this.alias,
      defaultTags: {
        tags: {
          Environment: stack.name,
          Description: DEFAULT_RESOURCE_COMMENT,
        },
      },
    });
  }

  /**
   * Provisions the cloud prerequisites to the stack
   *
   * @param {CloudProvider} stack the stack to deploy the prerequisites to
   */
  prerequisites(stack: CloudStack): void {
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

    this.key = new KmsKey(stack, `${this.identifier}-key`, {
      customerMasterKeySpec: 'SYMMETRIC_DEFAULT',
      deletionWindowInDays: 30,
      description: 'Stackmate default encryption key',
      enableKeyRotation: false,
      isEnabled: true,
      keyUsage: 'ENCRYPT_DECRYPT',
      multiRegion: false,
    });
  }

  onPrepare(stack: CloudStack): void {
    this.bootstrap(stack);
  }

  onDeploy(stack: CloudStack): void {
    this.bootstrap(stack);
    this.prerequisites(stack);
  }

  onDestroy(stack: CloudStack): void {
    this.bootstrap(stack);
  }
}

export default AwsProvider;
