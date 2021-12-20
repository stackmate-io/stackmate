import { AwsVpcService } from '@stackmate/clouds/aws';
import { AWS_REGIONS } from '@stackmate/clouds/aws/constants';
import { PROVIDER } from '@stackmate/constants';
import { AbstractConstructor, ProviderChoice, RegionList } from '@stackmate/types';

const AwsService = <TBase extends AbstractConstructor>(Base: TBase) => {
  abstract class AwsService extends Base {
    constructor(...args: any[]) {
      super(...args);
    }

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
     * @param {Object} dependencies the service's dependencies
     */
    public set dependencies({ vpc }: { vpc: AwsVpcService }) {
      this.vpcId = vpc.id;
    }
  };

  return AwsService;
}

export default AwsService;
