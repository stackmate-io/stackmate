import Service from '@stackmate/engine/core/service';
import { AWS } from '@stackmate/engine/types';
import { PROVIDER } from '@stackmate/engine/constants';
import { mergeJsonSchemas } from '@stackmate/engine/lib/helpers';
import { AWS_DEFAULT_REGION } from '@stackmate/engine/providers/aws/constants';

abstract class AwsService<Attrs extends AWS.Base.Attributes> extends Service<Attrs> implements AWS.Base.Type {
  /**
   * @var {String} provider the cloud provider used (eg. AWS)
   * @readonly
   */
  readonly provider: typeof PROVIDER.AWS = PROVIDER.AWS;

  /**
   * @var {String} region the region the service operates in
   */
  region: string = AWS_DEFAULT_REGION;

  /**
   * @var {ProviderService} providerService the cloud provider service
   */
  providerService: AWS.Provider.Type;

  /**
   * Callback to run when the cloud provider has been registered
   * @param {ProviderService} provider the provider service
   */
  onProviderRegistered(srv: AWS.Provider.Type): void {
    if (srv.region !== this.region) {
      return;
    }

    super.onProviderRegistered(srv);
  }

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
