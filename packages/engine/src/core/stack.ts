import { join as joinPaths } from 'path';
import { App as TerraformApp, Manifest, TerraformStack } from 'cdktf';

import { CloudStack } from '@stackmate/interfaces';

class Stack extends TerraformStack implements CloudStack {
  /**
   * @var {String} name the stack's name
   */
  readonly name: string;

  /**
   * @var {String} targetPath the path to output the terraform files
   */
  readonly targetPath: string;

  /**
   * @var {App} app the terraform app to synthesize
   * @readonly
   */
  public readonly app: TerraformApp;

  /**
   * @constructor
   * @param {String} name the stack's name
   * @param {String} targetPath the stack's target output path
   */
  constructor(name: string, targetPath: string) {
    const app = new TerraformApp({ outdir: targetPath, stackTraces: false });
    super(app, name);

    this.app = app;
    this.name = name;
    this.targetPath = targetPath;
  }

  /**
   * @returns {String} returns the stack path for the stage
   */
  public get path(): string {
    return joinPaths(this.targetPath, Manifest.stacksFolder, this.name);
  }

  /**
   * Synthesizes the application's stack and writes out the corresponding TF files
   * @void
   */
  generate(): void {
    this.app.synth();
  }
}

export default Stack;
