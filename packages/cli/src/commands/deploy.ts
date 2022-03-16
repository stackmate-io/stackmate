import { Command } from '@oclif/core';

import { deployStage } from '@stackmate/engine/'

class DeployCommand extends Command {
  /**
   * @var {String} description the command's description
   */
  static description: string = 'Deploy your infrastructure based to the cloud';

  /**
   * @var {Array} args the command's arguments
   */
  static args = [
    { name: 'stage', description: 'The stage to deploy', required: true },
  ];

  async run(): Promise<void> {
    const { args: { stage } } = await this.parse(DeployCommand);

    const projectFile: string = '';
    await deployStage(projectFile, stage);
  }
}

export default DeployCommand;
