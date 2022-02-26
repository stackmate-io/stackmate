import { snakeCase } from 'lodash';
import { TerraformProvider } from 'cdktf';

import Service from '@stackmate/core/service';
import { SERVICE_TYPE } from '@stackmate/constants';
import { ServiceTypeChoice } from '@stackmate/types';
import { ProviderService } from '@stackmate/interfaces';

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
  get isRegistered(): boolean {
    return this.resource instanceof TerraformProvider;
  }

  /**
   * @returns {String} the alias to use for the provider
   */
  public get alias(): string {
    return `${snakeCase(this.provider)}_${snakeCase(this.region)}`;
  }
}

export default Provider;
