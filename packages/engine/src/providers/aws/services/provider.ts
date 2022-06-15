import { snakeCase } from 'lodash';
import { InternetGateway, Subnet, Vpc } from '@cdktf/provider-aws/lib/vpc';
import { AwsProvider as TerraformAwsProvider } from '@cdktf/provider-aws';
import { KmsKey } from '@cdktf/provider-aws/lib/kms';

import AwsService from './base';
import { CloudStack, AWS, CoreServiceConfiguration } from '@stackmate/engine/types';
import { DEFAULT_IP, DEFAULT_RESOURCE_COMMENT, PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import { getNetworkingCidrBlocks, mergeJsonSchemas } from '@stackmate/engine/lib/helpers';

class AwsProvider extends AwsService<AWS.Provider.Attributes> implements AWS.Provider.Type {
  /**
   * @var {String} schemaId the schema id for the entity
   * @static
   */
  static schemaId: string = 'services/aws/provider';

  /**
   * @var {String} type the service type
   */
  readonly type = SERVICE_TYPE.PROVIDER;

  /**
   * @var {String} ip the CIDR block to use as a base for the service
   */
  ip: string = DEFAULT_IP;

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
   * @var {TerraformAwsProvider} resource the AWS provider resource
   */
  resource: TerraformAwsProvider;

  /**
   * @var {KmsKey} key the KMS key to use across the stack
   */
  key: KmsKey;

  /**
   * @returns {String} the alias to use for the provider
   */
  public get alias(): string {
    return `${snakeCase(this.provider)}_${snakeCase(this.region)}`;
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
   * @param {CloudStack} stack the stack to deploy the prerequisites to
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

  /**
   * @returns {BaseJsonSchema} provides the JSON schema to validate the entity by
   */
  static schema(): AWS.Provider.Schema {
    return mergeJsonSchemas(super.schema(), {
      $id: this.schemaId,
      properties: {
        ip: {
          type: 'string',
          default: DEFAULT_IP,
          format: 'ipv4',
          errorMessage: 'Please provide a valid IPv4 IP for the networking service',
        },
      },
      errorMessage: {
        _: 'The AWS provider service is not properly configured',
      },
    });
  }

  /**
   * @returns {Object} the attributes to use when populating the initial configuration
   */
  static config(): CoreServiceConfiguration<AWS.Provider.Attributes> {
    return {
      provider: PROVIDER.AWS,
    };
  }
}

export default AwsProvider;
