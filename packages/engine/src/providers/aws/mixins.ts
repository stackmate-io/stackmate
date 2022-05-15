import { PROVIDER } from '@stackmate/engine/constants';
import { AWS_REGIONS, AWS_DEFAULT_REGION } from '@stackmate/engine/providers/aws/constants';
import { AbstractConstructorOf, ProviderChoice, RegionList } from '@stackmate/engine/types';
import { Provider as AwsProvider } from '@stackmate/engine/providers/aws';
import { merge } from 'lodash';

const AwsService = <TBase extends AbstractConstructorOf & { schema: Function }>(
  Base: TBase,
  regions: RegionList = AWS_REGIONS,
) => {
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
    readonly regions: RegionList = regions;

    /**
     * @var {ProviderService} cloudProvider the cloud provider service
     */
    providerService: AwsProvider;

    /**
     * @returns {Object} provides the structure to generate the JSON schema by
     */
    static schema() {
      const regionValues = Object.values(regions);

      return merge({}, super.schema(), {
        region: {
          type: 'string',
          enum: regionValues,
          default: AWS_DEFAULT_REGION,
          errorMessage: `The region is invalid. Available options are: ${regionValues.join(', ')}`,
        },
      });
    }
  }

  return AwsServiceWrapper;
};

export default AwsService;
