import { LocalBackend } from 'cdktf';

import State from '@stackmate/engine/core/services-obsolete/state';
import { PROVIDER } from '@stackmate/engine/constants';
import { Attribute, AttributesOf, CloudStack, LocalStateService, ProviderChoice } from '@stackmate/engine/types';

export type AttributeSet = AttributesOf<LocalStateService>;

class LocalState extends State implements LocalStateService {
  /**
   * @var {String} directory the directory to store the output to
   */
  directory: Attribute<string>;

  /**
   * @var {ProviderChoice} provider the provider for the service
   */
  readonly provider: ProviderChoice = PROVIDER.LOCAL;

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

  /**
   * Provisioning when we initially prepare a stage
   *
   * @param {CloudStack} stack the stack to provision the service in
   * @void
   */
  onPrepare(stack: CloudStack): void {
    this.resources(stack);
  }

  /**
   * Provisioning when we deploy a stage
   *
   * @param {CloudStack} stack the stack to provision the service in
   * @void
   */
  onDeploy(stack: CloudStack): void {
    this.backend(stack);
  }

  /**
   * Provisioning on when we destroy destroy a stage
   *
   * @param {CloudStack} stack the stack to provision the service in
   * @void
   */
  onDestroy(stack: CloudStack): void {
    // The state has to be present when destroying resources
    this.backend(stack);
  }
}

export default LocalState;
