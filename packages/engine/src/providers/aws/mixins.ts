import { AwsVpcService } from '@stackmate/providers/aws';
import { AWS_REGIONS } from '@stackmate/providers/aws/constants';
import { PROVIDER } from '@stackmate/constants';
import { AbstractConstructor, ProviderChoice, RegionList } from '@stackmate/types';

const AwsService = <TBase extends AbstractConstructor>(Base: TBase) => {
  abstract class AwsServiceWrapper extends Base {
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
     * @var {String} vpcId the vpc id to use in the resources
     * @protected
     */
    vpcId: string;

    /**
     * @var {Array<String>} securityGroupIds the security group ids for the service
     * @protected
     */
    securityGroupIds: Array<string> = [];

    /**
     * @param {AwsVpcService} vpc the networking service
     */
    onNetworkingRegistered(vpc: AwsVpcService) {
      this.vpcId = vpc.id;
      this.securityGroupIds.push(vpc.securityGroupId);
    }

    // /**
    //  * @returns {ServiceAssociation[]} the pairs of lookup and handler functions
    //  */
    // @Memoize() public associations(): ServiceAssociation[] {
    //   return [
    //     ...super.associations(),
    //     {
    //     lookup: (srv: CloudService) => (
    //       srv.type === SERVICE_TYPE.NETWORKING
    //         // && srv.region === this.region
    //         && srv.provider === this.provider
    //     ),
    //     handler: this.onNetworkingRegistered.bind(this),
    //   }];
    // }
  }

  return AwsServiceWrapper;
};

export default AwsService;
