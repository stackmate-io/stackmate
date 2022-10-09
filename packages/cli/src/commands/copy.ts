import { Flags } from '@oclif/core';
import { cloneDeep, isEmpty } from 'lodash';
import { ArgInput, FlagInput } from '@oclif/core/lib/interfaces';
import { StageConfiguration, validateProperty } from '@stackmate/engine';

import { parseCommaSeparatedString } from '@stackmate/cli/lib';
import { BaseCommandWithProject } from '@stackmate/cli/core/commands/withProject';

type CopyFlags = {
  full?: boolean;
  skip?: string;
};

class StageCopyCommand extends BaseCommandWithProject {
  /**
   * @var {String} summary the command's short description
   */
  static summary = 'Copies a stage to anoyther.';

  /**
   * @var {Array} args the command's arguments
   */
  static args: ArgInput = [
    ...BaseCommandWithProject.args,
    {
      name: 'target',
      description: 'The target stage to copy',
      required: true,
      parse: async (input: string) => (input || '').trim(),
    },
  ];

  /**
   * @var {Object} flags the flags to use in the command
   */
  static flags: FlagInput<CopyFlags> = {
    ...BaseCommandWithProject.flags,
    full: Flags.boolean({
      default: false,
      required: false,
      description: 'Copy the entire stage with its services, not just ad a copy statement',
    }),
    skip: Flags.string({
      default: '',
      required: false,
      description: 'The comma separated service names to skip (should exist in the source stage)',
    }),
  };

  /**
   * Copies the services from a stage to another, changes their name and skips any requested ones
   *
   * @param {String} source the source stage to copy from
   * @param {String} target the target stage to copy to
   * @param {String[]} skipped any services to skip
   * @returns {StageConfiguration<true>['services']} the services to use
   */
  copyServices(
    source: string, target: string, skipped: string[] = [],
  ): StageConfiguration<true>['services'] {
    const { services = [] } = this.getStage(source);

    if (isEmpty(services)) {
      throw new Error('No servies to copy were provided');
    }

    return services.filter(
      srv => !skipped.includes(srv.name),
    ).map(srv => ({
      ...srv,
      name: srv.name.replace(source, target),
    }));
  }

  async run(): Promise<any> {
    const { target } = this.parsedArgs;
    const { full = false, skip = '' } = this.parsedFlags;

    const sourceStage = this.getStage(this.selectedStage);
    const sourceNames = (sourceStage.services || []).map(srv => srv.name);
    const targetStage = validateProperty('stages/items/properties/name', target);
    const projectConfig = cloneDeep(this.projectConfig);
    const skipped = parseCommaSeparatedString(skip).filter(n => sourceNames.includes(n));
    const copied: StageConfiguration<true> = { name: targetStage };

    if (full) {
      Object.assign(copied, { services: this.copyServices(sourceStage.name, target, skipped) });
    } else {
      Object.assign(copied, {
        ...(!isEmpty(skipped) ? { skip: skipped } : {}),
        copy: sourceStage.name, // validate that the stage exists
      });
    }

    Object.assign(projectConfig, {
      stages: [
        ...(projectConfig.stages || []),
        copied,
      ],
    });

    this.configFile.write(projectConfig);

    this.log(`Stage ${target} added to the project`);
  }
}

export default StageCopyCommand;
