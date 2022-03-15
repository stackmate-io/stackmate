import { LocalBackend } from 'cdktf';
import { join as joinPaths } from 'path';

import State from '@stackmate/engine/core/services/state';
import { APP_HOME_DIRECTORY, PROVIDER } from '@stackmate/engine/constants';
import { CloudStack } from '@stackmate/engine/interfaces';
import { ProviderChoice } from '@stackmate/engine/types';

class LocalState extends State {
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
  get isRegistered(): boolean {
    return true;
  }

  /**
   * @returns {String} the path to store the local file under
   */
  get path(): string {
    return `${this.stageName.toLowerCase()}-initial.tfstate`;
  }

  /**
   * @returns {String} the workspace directory to store the file under
   */
  get workspaceDir(): string {
    return joinPaths(APP_HOME_DIRECTORY, this.projectName.toLowerCase());
  }

  /**
   * Provisions the data source for the state
   *
   * @param {CloudStack} stack the stack to deploy the resources to
   */
  backend(stack: CloudStack): void {
    this.backendResource = new LocalBackend(stack, {
      path: this.path,
      workspaceDir: this.workspaceDir,
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
