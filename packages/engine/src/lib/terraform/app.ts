import { Memoize } from 'typescript-memoize';
import { Construct } from 'constructs';
import { AppOptions } from 'cdktf';

import Stack from '@stackmate/engine/lib/terraform/stack';
import { CloudApp, CloudStack } from '@stackmate/engine/types';

class App extends Construct implements CloudApp {
  /**
   * @var {String} name the application's name
   */
  readonly name: string;

  /**
   * @constructor
   * @param {AppOptions} options
   */
  constructor(name: string, options?: AppOptions) {
    super(undefined as any, "");
    this.name = name;
  }

  /**
   * Returns a stack for the app
   *
   * @param {String} name the name of the stack
   * @returns {CloudStack} the stack
   */
  @Memoize() stack(name: string): CloudStack {
    return new Stack(this, name);
  }
}

export default App;
