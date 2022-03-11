import Service from '@stackmate/core/service';
import { ServiceTypeChoice } from '@stackmate/types';
import { SERVICE_TYPE } from '@stackmate/constants';
import { CloudStack, StateService } from '@stackmate/interfaces';

abstract class State extends Service implements StateService {
  /**
   * @var {ServiceTypeChoice} type the service's type
   */
  type: ServiceTypeChoice = SERVICE_TYPE.STATE;

  /**
   * @var {Boolean} isAuthenticatable the service should not use authentication
   */
  readonly isAuthenticatable: boolean = false;

  /**
   * Provisions the state storage itself
   *
   * @param {CloudStack} stack the stack to deploy the resource to
   */
  abstract resources(stack: CloudStack): void;

  /**
   * Provisions a data resources for the state
   *
   * @param {CloudStack} stack the stack to deploy the resources to
   */
  abstract backend(stack: CloudStack): void;

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

export default State;
