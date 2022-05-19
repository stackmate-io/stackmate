import { PROVIDER } from '@stackmate/engine/constants';
import { AWS_REGIONS } from '@stackmate/engine/providers/aws/constants';
import {
  AbstractCloudServiceConstructor, AwsProviderService, ProviderChoice, RegionList,
} from '@stackmate/engine/types';

const AwsServiceMixin = <TBase extends AbstractCloudServiceConstructor>(
  Base: TBase,
  regions: RegionList = AWS_REGIONS,
) => {
  // type AwsWrappedSchema = AwsServiceSchemaG<BaseServiceSchema>;
  abstract class AwsMixin extends Base {
    /**
     * @var {String} provider the cloud provider used (eg. AWS)
     * @readonly
     */
    readonly provider: ProviderChoice = PROVIDER.AWS;

    /**
     * @var {ProviderService} providerService the cloud provider service
     */
    providerService: AwsProviderService;
  }

  return AwsMixin;
}

export default AwsServiceMixin;
