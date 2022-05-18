import { snakeCase } from 'lodash';
import { TerraformProvider } from 'cdktf';

import Service from '@stackmate/engine/core/service';
import { SERVICE_TYPE } from '@stackmate/engine/constants';
import {
  ServiceTypeChoice, CloudStack, ProviderService,
} from '@stackmate/engine/types';

abstract class Provider extends Service implements ProviderService {
  /**
   * @var {ServiceTypeChoice} type the service's type
   */
  readonly type: ServiceTypeChoice = SERVICE_TYPE.PROVIDER;

  /**
   * @var {TerraformProvider} resource the provider resource
   */
  resource: TerraformProvider;

  /**
   * @returns {Boolean} whether the provider has been registered
   */
  isRegistered(): boolean {
    return this.resource instanceof TerraformProvider;
  }

  /**
   * @returns {ServiceAssociation[]} the pairs of lookup and handler functions
   */
  public associations() {
    return []; // Provider services shouldn't depend on other services
  }

  /**
   * @returns {String} the alias to use for the provider
   */
  public get alias(): string {
    return `${snakeCase(this.provider)}_${snakeCase(this.region)}`;
  }

  /**
   * Registers the provider's resource to the stack
   *
   * @param {CloudStack} stack the stack to register the provider to
   */
  abstract bootstrap(stack: CloudStack): void;

  /**
   * Provisions the cloud prerequisites to the stack
   *
   * @param {CloudProvider} stack the stack to deploy the prerequisites to
   */
  abstract prerequisites(stack: CloudStack): void;
}

export default Provider;
