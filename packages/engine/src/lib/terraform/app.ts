import { join } from 'path';
import { Memoize } from 'typescript-memoize';
import { App as TerraformApp, AppOptions } from 'cdktf';

import Stack from '@stackmate/lib/terraform/stack';
import { DEBUG_MODE, OUTPUT_DIRECTORY } from '@stackmate/constants';
import { CloudApp, CloudStack } from '@stackmate/interfaces';

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
    const opts = {
      ...options,
      outdir: join(OUTPUT_DIRECTORY, name),
      stackTraces: DEBUG_MODE,
    }

    super(opts);

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
