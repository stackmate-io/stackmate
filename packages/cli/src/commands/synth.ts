import { BaseOperatableCommand } from '@stackmate/cli/core/commands/operatable';

class SynthStackCommand extends BaseOperatableCommand {
  /**
   * @var {String} summary the command's short description
   */
  static summary = 'Synthesizes the stack for a stage.';

  /**
   * @var {Array} args the command's arguments
   */
  static args = [
    ...BaseOperatableCommand.args,
  ];

  /**
   * @var {Object} flags the flags to use in the command
   */
  static flags = {
    ...BaseOperatableCommand.flags,
  };

  async run(): Promise<any> {
    const outputFile = this.synth(this.parsedArgs.operation);
    this.log(`Stack output file created under ${outputFile.filename}`);
  }
}

export default SynthStackCommand;
