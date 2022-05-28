import Service from '@stackmate/engine/core/service';
import { PROVIDER } from '@stackmate/engine/constants';
import { mergeJsonSchemas } from '@stackmate/engine/lib/helpers';
import { AWS_DEFAULT_REGION } from '@stackmate/engine/providers/aws/constants';
import { CoreServiceConfiguration, Local } from '@stackmate/engine/types';

abstract class LocalService<Attrs extends Local.Base.Attributes> extends Service<Attrs> implements Local.Base.Type {
  /**
   * @var {String} provider the cloud provider used (eg. AWS)
   * @readonly
   */
  readonly provider = PROVIDER.LOCAL;

  /**
   * @var {ProviderService} providerService the cloud provider service
   */
  providerService: Local.Provider.Type;

  /**
   * @returns {JsonSchema}
   */
  static schema(): Local.Base.Schema {
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

  /**
   * Returns the attributes to use when populating the initial configuration
   * @param {Object} options the options for the configuration
   * @returns {Object} the attributes
   */
  static config(): CoreServiceConfiguration<Local.Base.Attributes> {
    return {
      provider: 'local',
    };
  }
}

export default LocalService;
