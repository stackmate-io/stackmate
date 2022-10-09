import { Flags } from '@oclif/core';
import { ArgInput, FlagInput } from '@oclif/core/lib/interfaces';
import { getOperationByName, Operation, OperationType, OPERATION_TYPE, STACKMATE_DIRECTORY, validateProject } from '@stackmate/engine';

import OutputFile from '@stackmate/cli/core/output';
import BaseCommand from '@stackmate/cli/core/commands/base';
import {
  CommandWithProject, CommandWithProjectClass, withProject,
} from '@stackmate/cli/core/commands/withProject';

type OperatableCommandConstructor = abstract new (...args: any[]) => OperatableCommand;

export type OperatableCommand = CommandWithProject & {
  get operation(): Operation;
  get operationType(): OperationType;
  synth(operation: OperationType): OutputFile;
};

type OperatableCommandFlags = {
  output: string;
};

export type OperatableClass = OperatableCommandConstructor & CommandWithProjectClass & {
  flags: FlagInput<OperatableCommandFlags>;
};


export const operatable = (Base: CommandWithProjectClass): OperatableClass => {
  abstract class Operatable extends Base implements OperatableCommand {
    /**
     * @var {Operation} operation the operation instance cache
     */
    #operation: Operation;

    /**
     * @var {Array} args the command's arguments
     */
    static args: ArgInput = [
      ...Base.args,
      {
        name: 'operation',
        description: 'The operation to run',
        required: true,
        options: Object.values(OPERATION_TYPE),
        parse: async (input: string) => (input || '').trim(),
      },
    ];

    /**
     * @var {Object} flags the flags to use in the command
     */
    static flags: FlagInput<OperatableCommandFlags> = {
      ...Base.flags,
      output: Flags.string({
        default: STACKMATE_DIRECTORY,
        required: false,
        description: 'The path to output the files (relative, by default: ".stackmate" inside the current one)',
      }),
    };

    /**
     * @returns {OperationType} the operation type
     */
    get operationType(): OperationType {
      return this.parsedArgs.operation;
    }

    /**
     * @returns {Operation} the operation to run
     */
    get operation(): Operation {
      if (!this.#operation) {
        const project = validateProject(this.projectConfig);
        this.#operation = getOperationByName(this.operationType, project, this.selectedStage);
      }

      return this.#operation;
    }

    /**
     * @param {OperationType} operation the operation to run
     * @returns {OutputFile} the output file to use
     */
    synth(operation: OperationType): OutputFile {
      const output = this.operation.process();

      const outputFile = new OutputFile(this.selectedStage, this.parsedFlags.output, operation);
      outputFile.write(output);
      return outputFile;
    }
  }

  return Operatable;
};

export const BaseOperatableCommand = operatable(withProject(BaseCommand));
