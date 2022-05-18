import { LocalBackend } from 'cdktf';

import State from '@stackmate/engine/core/services/state';
import Parser from '@stackmate/engine/lib/parsers';
import { PROVIDER } from '@stackmate/engine/constants';
import { CloudStack, ProviderChoice } from '@stackmate/engine/types';
import { Attribute } from '@stackmate/engine/lib/decorators';

class LocalState extends State {
  /**
   * @var {String} directory the directory to store the output to
   */
  @Attribute directory: string;

  /**
   * @var {ProviderChoice} provider the provider for the service
   */
  provider: ProviderChoice = PROVIDER.LOCAL;

  /**
   * @var {DataTerraformRemoteStateS3} dataResource the data resource to use when registering the state
   */
  backendResource: LocalBackend;

  /**
   * @returns {Boolean} whether the state is registered
   */
  isRegistered(): boolean {
    return true;
  }

  /**
   * @returns {String} the path to store the local file under
   */
  get path(): string {
    return `${this.stageName.toLowerCase()}-initial.tfstate`;
  }

  /**
   * Provisions the data source for the state
   *
   * @param {CloudStack} stack the stack to deploy the resources to
   */
  backend(stack: CloudStack): void {
    this.backendResource = new LocalBackend(stack, {
      path: this.path,
      workspaceDir: this.directory,
    });
  }

  /**
   * Provisions the state storage itself
   *
   * @param {CloudStack} stack the stack to deploy the resource to
  */
  resources(stack: CloudStack): void {
    throw new Error('You can’t create a new resource for the local file state');
  }
}

export default LocalState;
