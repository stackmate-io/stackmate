import { Flags } from '@oclif/core';
import { OutputFlags } from '@oclif/core/lib/interfaces';
import { deployment, validateProject } from '@stackmate/engine';

import BaseCommand from '@stackmate/cli/core/commands/base';
import OperationCommand from '@stackmate/cli/core/commands/operation';
import { DEFAULT_OUTPUT_DIRECTORY } from '@stackmate/cli/constants';

class DeployCommand extends OperationCommand {
  /**
   * @var {String} description the command's description
   */
  static description: string = 'Deploy your infrastructure based to the cloud';

  /**
   * @var {Array} args the command's arguments
   */
  static args = [
    ...BaseCommand.args,
    { name: 'stage', description: 'The stage to deploy', required: true },
  ];

  /**
   * @var {Object} flags the parsed flags
   */
  protected parsedFlags: OutputFlags<typeof DeployCommand.flags>;

  /**
   * @var {Object} flags the flags to use in the command
   */
  static flags = {
    ...BaseCommand.flags,
    input: Flags.string({
      char: 'i',
      description: 'The directory to read the generated configuration from',
      required: true,
      default: DEFAULT_OUTPUT_DIRECTORY,
      exclusive: ['output'],
    }),
    output: Flags.string({
      char: 'o',
      description: 'The directory to write the generated configuration to',
      required: true,
      default: DEFAULT_OUTPUT_DIRECTORY,
      exclusive: ['input'],
    }),
  };

  /**
   * @var {String} stage the stage to operate
   */
  protected stage: string;

  /**
   * Initializes the commend
   */
  async init() {
    await super.init();
    const { stage } = this.parsedArgs;
    this.stage = stage;
  }

  /**
   * Synthesizes the operation and writes out the output
   */
  async run(): Promise<void> {
    const project = validateProject(this.projectConfig);
    const operation = deployment(project, this.stage);

    const tf = operation.process();

    console.log({
      tf,
    });
  }
}

export default DeployCommand;
