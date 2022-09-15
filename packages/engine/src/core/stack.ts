import { Construct } from 'constructs';
import { TerraformStack, App as TerraformApp, AppOptions } from 'cdktf';

import { BaseServiceAttributes } from '@stackmate/engine/core/service';

/**
 * @type {Stack} the stage's stack
 */
export type Stack = {
  readonly app: TerraformApp;
  readonly context: TerraformStack,
  readonly projectName: string;
  readonly stageName: string;
  readonly provisions: object[];
  hasProvisionsFor(a: object): boolean;
  markProvisioned(a: object): void;
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
   * @var {Construct[]}
   */
  readonly provisions: Construct[];

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
   * Returns whether a certain config object has provisions in the stack
   *
   * @param {BaseServiceAttributes} config the configuration to check whether we have provisions for
   * @returns {Boolean} whether a certain config object has provisions in the stack
   */
  hasProvisionsFor(config: BaseServiceAttributes): boolean {
    return true;
  }

  /**
   * Marks a configuration object as provisioned
   *
   * @param {BaseServiceAttributes} config the configuration to mark as provisioned
   */
  markProvisioned(config: BaseServiceAttributes): void {
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
