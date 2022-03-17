import { Memoize } from 'typescript-memoize';
import { App as TerraformApp, AppOptions } from 'cdktf';

import Stack from '@stackmate/engine/lib/terraform/stack';
import { CloudApp, CloudStack } from '@stackmate/engine/types';
import { DEBUG_MODE } from '@stackmate/engine/constants';

class App extends TerraformApp implements CloudApp {
  /**
   * @var {String} name the application's name
   */
  readonly name: string;

  /**
   * @constructor
   * @param {AppOptions} options
   */
  constructor(name: string, options?: AppOptions) {
    super({
      stackTraces: DEBUG_MODE,
      ...options,
    });

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
