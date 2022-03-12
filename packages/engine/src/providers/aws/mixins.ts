import { AWS_REGIONS } from '@stackmate/providers/aws/constants';
import { PROVIDER } from '@stackmate/constants';
import { AbstractConstructor, ProviderChoice, RegionList } from '@stackmate/types';
import { Provider as AwsProvider } from '@stackmate/providers/aws';

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
     * @var {ProviderService} cloudProvider the cloud provider service
     */
    providerService: AwsProvider;
  }

  return AwsServiceWrapper;
};

export default AwsService;
