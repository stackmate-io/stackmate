import Service from '@stackmate/engine/core/service';
import { PROVIDER } from '@stackmate/engine/constants';
import { mergeJsonSchemas } from '@stackmate/engine/lib/helpers';
import { AWS_DEFAULT_REGION } from '@stackmate/engine/providers/aws/constants';
import { AWS } from '@stackmate/engine/types';

abstract class AwsService<Attrs extends AWS.Base.Attributes> extends Service<Attrs> implements AWS.Base.Type {
  /**
   * @var {String} provider the cloud provider used (eg. AWS)
   * @readonly
   */
  readonly provider: typeof PROVIDER.AWS = PROVIDER.AWS;

  /**
   * @var {ProviderService} providerService the cloud provider service
   */
  providerService: AWS.Provider.Type;

  /**
   * @returns {JsonSchema}
   */
  static schema(): AWS.Base.Schema {
    const regionValues = Object.values(AWS_DEFAULT_REGION);

    return mergeJsonSchemas(super.schema(), {
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
