import { Flags } from '@oclif/core';
import { ArgInput, FlagInput } from '@oclif/core/lib/interfaces';

import BaseCommand from '@stackmate/cli/core/commands/base';
import { getOperationByName, OPERATION_TYPE, STACKMATE_DIRECTORY, validateProject } from '@stackmate/engine';
import OutputFile from '../core/output';

type SynthFlags = {
  path?: string;
};

class SynthStackCommand extends BaseCommand {
  /**
   * @var {String} summary the command's short description
   */
  static summary = 'Synthesizes the stack for a stage.';

  /**
   * @var {Array} args the command's arguments
   */
  static args: ArgInput = [
    ...BaseCommand.args,
    {
      name: 'operation',
      description: 'The operation to run',
      required: true,
      options: Object.values(OPERATION_TYPE),
      parse: async (input: string) => (input || '').trim(),
    },
    {
      name: 'stage',
      description: 'The stage to synthesize',
      required: true,
      parse: async (input: string) => (input || '').trim(),
    },
  ];

  /**
   * @var {Object} flags the flags to use in the command
   */
  static flags: FlagInput<SynthFlags> = {
    ...BaseCommand.flags,
    path: Flags.string({
      default: STACKMATE_DIRECTORY,
      required: false,
      description: 'The path to output the files (relative, by default: ".stackmate" inside the current one)',
    }),
  };

  async run(): Promise<any> {
    const project = validateProject(this.projectConfig);
    const { operation, stage } = this.parsedArgs;
    const { path: dirname = STACKMATE_DIRECTORY } = this.parsedFlags;
    const stack = getOperationByName(operation, project, stage).process();

    const outputFile = new OutputFile(stage, dirname);
    outputFile.write(stack);

    this.log(`Stack output file created under ${outputFile.filename}`);
  }
}

export default SynthStackCommand;
