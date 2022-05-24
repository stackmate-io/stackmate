import { snakeCase } from 'lodash';
import { TerraformProvider } from 'cdktf';
import { LocalProvider as TerraformLocalProvider } from '@cdktf/provider-local';

import LocalService from './base';
import { CloudStack, Local } from '@stackmate/engine/types';
import { SERVICE_TYPE } from '@stackmate/engine/constants';

class LocalProvder extends LocalService<Local.Provider.Attributes> implements Local.Provider.Type {
  /**
   * @var {String} type the service type
   */
  readonly type = SERVICE_TYPE.PROVIDER;

  /**
   * @var {TerraformProvider} resource the provider resource
   */
  resource: TerraformProvider;

  /**
   * @returns {Boolean} whether the service is registered in the stack
   */
  isRegistered(): boolean {
    return this.resource instanceof TerraformLocalProvider;
  }

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
    this.resource = new TerraformLocalProvider(stack, this.provider, {
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
