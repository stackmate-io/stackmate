import { TerraformStack } from 'cdktf';

import { CloudStack, CloudApp } from '@stackmate/engine/types';

class Stack extends TerraformStack implements CloudStack {
  /**
   * @var {String} name the stack's name
   */
  readonly name: string;

  /**
   * @constructor
   * @param {String} name the stack's name
   */
  constructor(app: CloudApp, name: string) {
    super(app, name);

    this.name = name;
  }
}

export default Stack;
