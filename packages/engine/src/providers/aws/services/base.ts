import Service from '@stackmate/engine/core/service';
import { PROVIDER } from '@stackmate/engine/constants';
import { mergeJsonSchemas } from '@stackmate/engine/lib/helpers';
import { AWS, ConfigurationOptions } from '@stackmate/engine/types';
import { AWS_DEFAULT_REGION, AWS_REGIONS } from '@stackmate/engine/providers/aws/constants';

abstract class AwsService<Attrs extends AWS.Base.Attributes = AWS.Base.Attributes> extends Service<Attrs> implements AWS.Base.Type {
  /**
   * @var {String} schemaId the schema id for the entity
   * @static
   */
  static schemaId: string = 'services/aws/base';

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
   * @returns {BaseJsonSchema} provides the JSON schema to validate the entity by
   */
  static schema(): AWS.Base.Schema {
    const regionValues = Object.values(AWS_REGIONS);

    return mergeJsonSchemas(super.schema(), {
      $id: this.schemaId,
      properties: {
        // provider: {
        //   type: 'string',
        //   enum: [PROVIDER.AWS],
        //   const: PROVIDER.AWS,
        // },
        region: {
          type: 'string',
          enum: regionValues,
          default: String(AWS_DEFAULT_REGION),
          errorMessage: `The region is invalid. Available options are: ${regionValues.join(', ')}`,
        },
      },
    });
  }

  /**
   * Returns the attributes to use when populating the initial configuration
   * @param {Object} options the options for the configuration
   * @returns {Object} the attributes
   */
  static config(): ConfigurationOptions<AWS.Base.Attributes> {
    return {
      provider: PROVIDER.AWS,
    };
  }
}

export default AwsService;
