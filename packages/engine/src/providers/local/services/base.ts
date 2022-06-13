import Service from '@stackmate/engine/core/service';
import { PROVIDER } from '@stackmate/engine/constants';
import { mergeJsonSchemas } from '@stackmate/engine/lib/helpers';
import { CoreServiceConfiguration, Local } from '@stackmate/engine/types';

abstract class LocalService<Attrs extends Local.Base.Attributes> extends Service<Attrs> implements Local.Base.Type {
  /**
   * @var {String} schemaId the schema id for the entity
   * @static
   */
  static schemaId: string = 'services/local/base';

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
   * @returns {BaseJsonSchema} provides the JSON schema to validate the entity by
   */
  static schema(): Local.Base.Schema {
    return mergeJsonSchemas(super.schema(), {
      $id: this.schemaId,
      additionalProperties: false,
      properties: {
        provider: {
          type: 'string',
          const: PROVIDER.LOCAL,
          enum: [PROVIDER.LOCAL],
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
      provider: PROVIDER.LOCAL,
    };
  }
}

export default LocalService;
