import { App as TerraformApp, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

import { CloudStack } from '@stackmate/interfaces';

class Stack extends TerraformStack implements CloudStack {
  /**
   * @var {String} name stack's name
   * @readonly
   */
  readonly name: string;

  /**
   * @var {Construct} scope the terraform app to use
   * @readonly
   */
  readonly scope: Construct;

  constructor(name: string, scope: Construct) {
    super(scope, name);

    this.scope = scope;
    this.name = name;
  }

  /**
   * Instantiates a stack
   *
   * @param {String} name the name of the stage to use
   * @returns {CloudStack} the stack
   */
  static factory(name: string): CloudStack {
    return new Stack(name, new TerraformApp());
  }
}

export default Stack;
