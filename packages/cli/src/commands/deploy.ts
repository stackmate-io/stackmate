import { stageDeployment } from '@stackmate/engine';
import OperationCommand from '@stackmate/cli/core/base-commands/operation';

class DeployCommand extends OperationCommand {
  /**
   * @var {String} description the command's description
   */
  static description: string = 'Deploy your infrastructure based to the cloud';

  async run(): Promise<void> {
    await stageDeployment(this.projectConfig, this.stage, {
      outputPath: this.outputPath,
    });
  }
}

export default DeployCommand;
