import { App as TerraformApp } from 'cdktf';

import Stack from '@stackmate/lib/terraform/stack';
import { CloudApp, CloudStack } from '@stackmate/interfaces';
import { Memoize } from 'typescript-memoize';

class App extends TerraformApp implements CloudApp {
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
