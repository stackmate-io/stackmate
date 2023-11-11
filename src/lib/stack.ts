import { kebabCase, snakeCase } from 'lodash'
import { TerraformStack, App as TerraformApp, TerraformLocal } from 'cdktf'
import type { Dictionary } from 'lodash'

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
   * @var {Dictionary<string>} variables the variables available in the operation
   */
  readonly #variables: Dictionary<string | undefined>

  /**
   * @constructor
   * @param {String} name the stack's name
   */
  constructor(name: string, variables: Dictionary<string | undefined> = {}) {
    this.#variables = variables
    this.name = kebabCase(name.replace('([^a-zA-Z0-9s-_]+)', '').toLowerCase())
    this.app = new TerraformApp()
    this.context = new TerraformStack(this.app, this.name)
  }

  /**
   * Registers a local variable to the stack
   *
   * @param {String} name the name of the variable
   * @returns {TerraformLocal}
   */
  local(name: string) {
    return new TerraformLocal(this.context, snakeCase(`var_${name}`), this.#variables[name] || '')
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
