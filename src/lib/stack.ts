import path from 'node:path'
import { kebabCase, snakeCase } from 'lodash'
import { TerraformStack, App as TerraformApp, TerraformLocal, Manifest } from 'cdktf'
import type { SynthesizedStack } from '@cdktf/cli-core'
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
  constructor(
    name: string,
    workingDirectory: string = process.cwd(),
    variables: Dictionary<string | undefined> = {},
  ) {
    this.#variables = variables
    this.name = kebabCase(name.replace('([^a-zA-Z0-9s-_]+)', '').toLowerCase())
    this.app = new TerraformApp({ outdir: workingDirectory })
    this.context = new TerraformStack(this.app, this.name)
  }

  /**
   * Registers a local variable to the stack
   *
   * @param {String} name the name of the variable
   * @returns {TerraformLocal}
   */
  local(name: string): TerraformLocal {
    return new TerraformLocal(this.context, snakeCase(`var_${name}`), this.#variables[name] || '')
  }

  /**
   * @returns {Object} the stack exported as terraform json object
   */
  toSynthesized(): SynthesizedStack {
    const workingDirectory = path.join(this.app.outdir, Manifest.stacksFolder, this.name)

    return {
      name: this.name,
      content: JSON.stringify(this.context.toTerraform(), null, 2),
      workingDirectory,
      annotations: [],
      constructPath: workingDirectory,
      stackMetadataPath: 'metadata.json',
      synthesizedStackPath: path.join(workingDirectory, 'main.tf.json'),
      dependencies: [], // stacks in stackmate are independent
    }
  }
}
