import { snakeCase } from 'lodash';
import { LocalProvider as TerraformLocalProvider } from '@cdktf/provider-local';

import LocalService from './base';
import { SERVICE_TYPE } from '@stackmate/engine/constants';
import { CloudStack, Local } from '@stackmate/engine/types';

class LocalProvder extends LocalService<Local.Provider.Attributes> implements Local.Provider.Type {
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
}

export default LocalProvder;
