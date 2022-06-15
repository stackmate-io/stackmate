import { LocalBackend } from 'cdktf';

import LocalService from './base';
import { DEFAULT_STATE_SERVICE_NAME, SERVICE_TYPE } from '@stackmate/engine/constants';
import { CloudStack, CoreServiceConfiguration, Local } from '@stackmate/engine/types';
import { mergeJsonSchemas } from '@stackmate/engine/lib/helpers';

class LocalState extends LocalService<Local.State.Attributes> implements Local.State.Type {
  /**
   * @var {String} schemaId the schema id for the entity
   * @static
   */
  static schemaId: string = 'services/local/state';

  /**
   * @var {ProviderChoice} provider the provider for the service
   */
  readonly type = SERVICE_TYPE.STATE;

  /**
   * @var {String} name the service's name
   */
  name: string = DEFAULT_STATE_SERVICE_NAME;

  /**
   * @var {String} directory the directory to store the output to
   */
  directory: string;

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
    new LocalBackend(stack, {
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

  /**
   * Returns the attributes to use when populating the initial configuration
   * @param {Object} options the options for the configuration
   * @returns {Object} the attributes
   */
  static config(): CoreServiceConfiguration<Local.State.Attributes> {
    return {
      provider: 'local',
    };
  }

  /**
   * @returns {BaseJsonSchema} provides the JSON schema to validate the entity by
   */
  static schema(): Local.State.Schema {
    return mergeJsonSchemas(super.schema(), {
      $id: this.schemaId,
      properties: {
        name: {
          default: DEFAULT_STATE_SERVICE_NAME,
        },
        type: {
          default: SERVICE_TYPE.STATE,
        },
      },
    });
  }
}

export default LocalState;
