import { TerraformStack } from 'cdktf';

import App from '@stackmate/lib/terraform/app';
import { CloudStack } from '@stackmate/interfaces';

class Stack extends TerraformStack implements CloudStack {
  /**
   * @var {String} name the stack's name
   */
  readonly name: string;

  /**
   * @var {App} app the terraform app to synthesize
   * @readonly
   */
  public readonly app: App;

  /**
   * @constructor
   * @param {String} name the stack's name
   */
  constructor(app: App, name: string) {
    super(app, name);

    this.app = app;
    this.name = name;
  }
}

export default Stack;
