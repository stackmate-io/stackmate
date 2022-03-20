import OperationCommand from '@stackmate/cli/core/base-commands/operation';
import { stageDeployment, OperationOptions } from '@stackmate/engine';

class DeployCommand extends OperationCommand {
  /**
   * @var {String} description the command's description
   */
  static description: string = 'Deploy your infrastructure based to the cloud';

  /**
   * @var {Array} args the command's arguments
   */
  static args = [
    ...OperationCommand.args,
  ];

  /**
   * @var {Object} flags the flags to use in the command
   */
  static flags = {
    ...OperationCommand.flags,
  }

  /**
   * @returns {Object} the operation's output
   */
  get output(): object {
    const options: OperationOptions = {
      outputPath: this.outputPath,
    };

    return stageDeployment(this.projectConfig, this.stage, options);
  }
}

export default DeployCommand;
