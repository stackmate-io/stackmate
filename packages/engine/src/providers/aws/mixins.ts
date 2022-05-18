import { PROVIDER } from '@stackmate/engine/constants';
import { AWS_REGIONS, AWS_DEFAULT_REGION } from '@stackmate/engine/providers/aws/constants';
import { mergeJsonSchemas } from '@stackmate/engine/lib/helpers';
import {
  AbstractCloudServiceConstructor,
  AwsProviderService,
  AwsServiceSchemaG, BaseServiceSchema,
  JsonSchema, ProviderChoice, RegionList,
} from '@stackmate/engine/types';

const AwsServiceMixin = <TBase extends AbstractCloudServiceConstructor>(
  Base: TBase,
  regions: RegionList = AWS_REGIONS,
) => {
  type AwsWrappedSchema = AwsServiceSchemaG<BaseServiceSchema>;
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

    static schema(): JsonSchema<AwsWrappedSchema> {
      const regionValues = Object.values(regions);

      return mergeJsonSchemas<BaseServiceSchema, AwsWrappedSchema>(super.schema<BaseServiceSchema>(), {
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
