import { App as TerraformApp, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { EnvironmentStack } from 'interfaces';

class Stack extends TerraformStack implements EnvironmentStack {
  readonly name: string;

  readonly scope: Construct;

  readonly defaults: object;

  constructor(scope: Construct, name: string, defaults: object) {
    super(scope, name);

    this.defaults = defaults;
    this.scope = scope;
    this.name = name;
  }

  static factory(name: string, defaults: object = {}): EnvironmentStack {
    return new Stack(new TerraformApp(), name, defaults);
  }
}

export default Stack;
