import { AWS_REGIONS } from '@stackmate/engine/providers/aws/constants';
import { PROVIDER } from '@stackmate/engine/constants';
import { AbstractConstructorOf, ProviderChoice, RegionList } from '@stackmate/engine/types';
import { Provider as AwsProvider } from '@stackmate/engine/providers/aws';

const AwsService = <TBase extends AbstractConstructorOf>(Base: TBase) => {
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
