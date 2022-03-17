import { Command, Flags } from '@oclif/core';

import { stageDeployment, OperationOptions } from '@stackmate/engine';
// import { DEFAULT_PROJECT_DIRECTORY, DEFAULT_PROJECT_FILE } from '@stackmate/cli/constants';

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

  /**
   * @var {Object} flags the flags to use in the command
   */
  static flags = {
    file: Flags.string({
      char: 'f',
      description: 'Which configuration file to use',
      required: false,
      // default: DEFAULT_PROJECT_FILE,
    }),
    output: Flags.string({
      char: 'o',
      description: 'Where to store the generated output',
      required: false,
      // default: DEFAULT_PROJECT_DIRECTORY,
    }),
  }

  async run(): Promise<void> {
    const {
      args: { stage },
      flags: { file: projectFile, output: outputPath },
    } = await this.parse(DeployCommand);

    const options: OperationOptions = { outputPath };
    console.log({ stage, projectFile, outputPath, stageDeployment, options });
    // await stageDeployment(projectFile, stage, options);
  }
}

export default DeployCommand;
