import { TerraformStack, App as TerraformApp, AppOptions } from 'cdktf';

import { Provisionable, Provisions } from '@stackmate/engine/core/service';

/**
 * @type {Stack} the stage's stack
 */
export type Stack = {
  readonly app: TerraformApp;
  readonly context: TerraformStack,
  readonly projectName: string;
  readonly stageName: string;
  isProvisioned(id: Provisionable['id']): boolean;
  storeResources(id: Provisionable['id'], provisions: Provisions): void;
  resources(id: string): Provisions;
};

class StageStack implements Stack {
  /**
   * @var {String} id the stack's id
   * @readonly
   */
  readonly id: string;

  /**
   * @var {TerraformApp} app the terraform app for synthesizing the stack
   * @readonly
   */
  readonly app: TerraformApp;

  /**
   * @var {TerraformStack} context the terraform stack object for synthesizing the stack
   * @readonly
   */
  readonly context: TerraformStack;

  /**
   * @var {String} projectName the project's name
   * @readonly
   */
  readonly projectName: string;

  /**
   * @var {String} stageName the stage's name
   * @readonly
   */
  readonly stageName: string;

  /**
   * @var {Map<Provisionable['id'], Provisions>} provisions map of provisionable id to provisions
   * @protected
   * @readonly
   */
  protected readonly provisions: Map<Provisionable['id'], Provisions> = new Map();

  /**
   * @constructor
   * @param {String} projectName the project's name
   * @param {String} stageName the stage's name
   * @param {AppOptions} options the terraform app options
   */
  constructor(projectName: string, stageName: string, options?: AppOptions) {
    this.projectName = projectName;
    this.stageName = stageName;
    this.app = new TerraformApp(options);
    this.id = `${this.projectName}/${this.stageName}`;
    this.context = new TerraformStack(this.app, this.id);
  }

  /**
   * Returns whether a Provisionable has been provisioned
   *
   * @param {String} id the id of the provisionable
   * @returns {Boolean}
   */
  isProvisioned(id: Provisionable['id']): boolean {
    return this.provisions.has(id);
  }

  /**
   * Stores resources provisionables
   *
   * @param {String} id the id of the provisionable
   * @param {Provisions} resources the provisions to store
   */
  storeResources(id: Provisionable['id'], resources: Provisions): void {
    this.provisions.set(id, resources);
  }

  /**
   * Returns resources associated to a provisionable
   *
   * @param {String} id the provisionable's id
   */
  resources(id: string): Provisions {
    return this.provisions.get(id) || {};
  }
}

/**
 * Returns a stack object to be used for stage composition
 *
 * @param {String} projectName the project's name
 * @param {String} stageName the stage's name
 * @param {AppOptions} options the terraform app options
 * @returns {Stack} the stack object
 */
export const getStack = (projectName: string, stageName: string, options?: AppOptions): Stack => (
  new StageStack(projectName, stageName, options)
);
