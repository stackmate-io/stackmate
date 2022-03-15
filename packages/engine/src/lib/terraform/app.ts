import { Memoize } from 'typescript-memoize';
import { App as TerraformApp, AppOptions } from 'cdktf';

import Stack from '@stackmate/engine/lib/terraform/stack';
import Environment from '@stackmate/engine/lib//environment';
import { DEBUG_MODE, DEFAULT_OUTPUT_PATH, ENVIRONMENT_VARIABLE } from '@stackmate/engine/constants';
import { CloudApp, CloudStack } from '@stackmate/engine/interfaces';

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
    super({ ...options, ...App.options(name) });

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

  /**
   * Returns the app's options that should overload the defaults
   *
   * @param {String} name the app's name
   * @returns {AppOptions} the options to use for the app
   */
  static options(name: string): AppOptions {
    return {
      outdir: Environment.get(ENVIRONMENT_VARIABLE.OUTPUT_DIR) || DEFAULT_OUTPUT_PATH,
      stackTraces: DEBUG_MODE,
    };
  }
}

export default App;
