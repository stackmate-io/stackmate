import { PROVIDER } from '@stackmate/engine/constants';
import { AWS_REGIONS, AWS_DEFAULT_REGION } from '@stackmate/engine/providers/aws/constants';
import { mergeJsonSchemas } from '@stackmate/engine/lib/helpers';
import {
  AbstractCloudServiceConstructor,
  AwsServiceSchema, BaseServiceSchema,
  JsonSchema, ProviderChoice, RegionList,
} from '@stackmate/engine/types';

const AwsServiceMixin = <TBase extends AbstractCloudServiceConstructor>(
  Base: TBase,
  regions: RegionList = AWS_REGIONS,
) => {
  abstract class AwsMixin extends Base {
    /**
     * @var {String} provider the cloud provider used (eg. AWS)
     * @readonly
     */
    readonly provider: ProviderChoice = PROVIDER.AWS;

    static schema(): JsonSchema<AwsServiceSchema> {
      const regionValues = Object.values(regions);

      return mergeJsonSchemas<BaseServiceSchema, AwsServiceSchema>(super.schema(), {
        properties: {
          provider: {
            type: 'string',
            const: PROVIDER.AWS,
          },
          region: {
            type: 'string',
            enum: regionValues,
            default: String(AWS_DEFAULT_REGION),
            errorMessage: `The region is invalid. Available options are: ${regionValues.join(', ')}`,
          },
        },
      });
    }
  }

  return AwsMixin;
}

export default AwsServiceMixin;
