import { BaseOperatableCommand } from '@stackmate/cli/core/commands/operatable';

class SynthStackCommand extends BaseOperatableCommand {
  /**
   * @var {String} summary the command's short description
   */
  static summary = 'Synthesizes the stack for a stage.';

  async run(): Promise<any> {
    const outputFile = this.synth(this.parsedArgs.operation);
    this.log(`Stack output file created under ${outputFile.filename}`);
  }
}

export default SynthStackCommand;
