import { kebabCase } from 'lodash'
import { TerraformStack, App as TerraformApp } from 'cdktf'

export class Stack {
  /**
   * @var {TerraformApp} app the terraform app for synthesizing the stack
   * @readonly
   */
  readonly app: TerraformApp

  /**
   * @var {TerraformStack} context the terraform stack object for synthesizing the stack
   * @readonly
   */
  readonly context: TerraformStack

  /**
   * @var {string} name the stack's name
   */
  readonly name: string

  /**
   * @constructor
   * @param {String} name the stack's name
   */
  constructor(name: string) {
    this.name = kebabCase(name.replace('([^a-zA-Z0-9s-_]+)', '').toLowerCase())
    this.app = new TerraformApp()
    this.context = new TerraformStack(this.app, this.name)
  }

  /**
   * Registers CDTKF context
   *
   * @param handler {Function}
   */
  inContext(handler: (ctx: TerraformStack, app?: TerraformApp) => void) {
    handler(this.context, this.app)
  }

  /**
   * @returns {Object} the stack exported as terraform json object
   */
  toObject(): object {
    return this.context.toTerraform()
  }
}
