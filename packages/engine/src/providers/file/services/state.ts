import { DataTerraformRemoteStateLocal } from 'cdktf';

import State from '@stackmate/core/services/state';
import { PROVIDER } from '@stackmate/constants';
import { CloudStack } from '@stackmate/interfaces';
import { ProviderChoice } from '@stackmate/types';
import { Attribute } from '@stackmate/lib/decorators';

class LocalState extends State {
  /**
   * @var {String} path the path to store the local file to
   */
  @Attribute path: string;

  /**
   * @var {ProviderChoice} provider the provider for the service
   */
  provider: ProviderChoice = PROVIDER.LOCAL;

  /**
   * @var {DataTerraformRemoteStateLocal} dataResource the data resource for the local file
   */
  dataResource: DataTerraformRemoteStateLocal;

  /**
   * @returns {Boolean} whether the state is registered
   */
  get isRegistered(): boolean {
    return true;
  }

  /**
   * Provisions the data source for the state
   *
   * @param {CloudStack} stack the stack to deploy the resources to
   */
  data(stack: CloudStack): void {
    this.dataResource = new DataTerraformRemoteStateLocal(stack, this.identifier, {
      path: this.path,
    });
  }

  resources(stack: CloudStack): void {
    throw new Error('You can’t create a new resource for the local file state');
  }
}

export default LocalState;
