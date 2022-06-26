import { snakeCase } from 'lodash';
import { LocalProvider, LocalProvider as TerraformLocalProvider } from '@cdktf/provider-local';

import LocalService from './base';
import { CloudStack, Local } from '@stackmate/engine/types';
import { CORE_SERVICE_SKIPPED_PROPERTIES, SERVICE_TYPE } from '@stackmate/engine/constants';
import { mergeJsonSchemas, preventJsonSchemaProperties } from '@stackmate/engine/lib/helpers';

class LocalProviderService extends LocalService<Local.Provider.Attributes> implements Local.Provider.Type {
  /**
   * @var {String} schemaId the schema id for the entity
   * @static
   */
  static schemaId: string = 'services/local/provider';

  /**
   * @var {String} type the service type
   */
  readonly type = SERVICE_TYPE.PROVIDER;

  /**
   * This is added just for consistency, no need to boostrap the local provider
   * @var {LocalProvder} resource the local provider resource
   */
  resource: LocalProvider;

  /**
   * @returns {String} the alias to use for the provider
   */
  public get alias(): string {
    return `${snakeCase(this.provider)}_${this.type}`;
  }

  /**
   * Registers the provider's resource to the stack
   *
   * @param {CloudStack} stack the stack to register the provider to
   */
  bootstrap(stack: CloudStack): void {
    new TerraformLocalProvider(stack, this.provider, {
      alias: this.alias,
    });
  }

  /**
   * Provisions the cloud prerequisites to the stack
   *
   * @param {CloudStack} stack the stack to deploy the prerequisites to
   */
  prerequisites(stack: CloudStack): void {
    // Nothing to see here, move along
  }

  onPrepare(stack: CloudStack): void {
    this.bootstrap(stack);
  }

  onDeploy(stack: CloudStack): void {
    this.bootstrap(stack);
  }

  onDestroy(stack: CloudStack): void {
    this.bootstrap(stack);
  }

  /**
   * @returns {BaseJsonSchema} provides the JSON schema to validate the entity by
   */
  static schema(): Local.Provider.Schema {
    return mergeJsonSchemas(
      preventJsonSchemaProperties(super.schema(), ...CORE_SERVICE_SKIPPED_PROPERTIES), {
      $id: this.schemaId,
      properties: {
        type: {
          const: SERVICE_TYPE.PROVIDER,
          enum: [SERVICE_TYPE.PROVIDER],
          default: SERVICE_TYPE.PROVIDER,
        },
      },
      errorMessage: {
        _: 'The local provider service is not properly configured',
      },
    });
  }
}

export default LocalProviderService;
