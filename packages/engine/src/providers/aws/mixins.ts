import { PROVIDER } from '@stackmate/engine/constants';
import { AWS_REGIONS, AWS_DEFAULT_REGION } from '@stackmate/engine/providers/aws/constants';
import { AbstractConstructorOf, AwsServiceSchema, BaseServiceSchema, JsonSchema, ProviderChoice, RegionList } from '@stackmate/engine/types';
import { Provider as AwsProvider } from '@stackmate/engine/providers/aws';
import { mergeJsonSchemas } from '@stackmate/engine/lib/helpers';

const AwsService = <TBase extends AbstractConstructorOf & { schema(): JsonSchema<BaseServiceSchema> }>(
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
     * @var {ProviderService} cloudProvider the cloud provider service
     */
    providerService: AwsProvider;

    /**
     * @returns {Object} provides the structure to generate the JSON schema by
     */
    static schema(): JsonSchema<AwsServiceSchema> {
      const regionValues = Object.values(regions);

      return mergeJsonSchemas(super.schema() as JsonSchema<BaseServiceSchema>, {
        properties: {
          provider: {
            type: 'string',
            const: PROVIDER.AWS,
          },
          region: {
            type: 'string',
            enum: regionValues,
            default: AWS_DEFAULT_REGION,
            errorMessage: `The region is invalid. Available options are: ${regionValues.join(', ')}`,
          },
        }
      });
    }
  }

  return AwsServiceWrapper;
};

export default AwsService;
