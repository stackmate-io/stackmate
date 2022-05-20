import Service, { AttributeSet as BaseServiceAttributeSet } from '@stackmate/engine/core/service';
import { PROVIDER } from '@stackmate/engine/constants';
import { mergeJsonSchemas } from '@stackmate/engine/lib/helpers';
import { AWS_DEFAULT_REGION } from '@stackmate/engine/providers/aws/constants';
import { AttributesOf, AwsCloudService, JsonSchema } from '@stackmate/engine/types';

// TODO: replace with type
import AwsProvider from '@stackmate/engine/providers/aws/services/provider';

export type AttributeSet = AttributesOf<AwsCloudService>;

abstract class AwsService extends Service implements AwsCloudService {
  /**
   * @var {String} provider the cloud provider used (eg. AWS)
   * @readonly
   */
  readonly provider = PROVIDER.AWS;

  /**
   * @var {ProviderService} providerService the cloud provider service
   */
  providerService: AwsProvider;

  /**
   * @returns {JsonSchema}
   */
  static schema(): JsonSchema<AttributeSet> {
    const regionValues = Object.values(AWS_DEFAULT_REGION);

    return mergeJsonSchemas<BaseServiceAttributeSet, AttributeSet>(super.schema(), {
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

export default AwsService;
