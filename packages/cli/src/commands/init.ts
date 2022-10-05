import inquirer from 'inquirer';
import { isEmpty, kebabCase } from 'lodash';
import { Flags } from '@oclif/core';
import { OutputFlags } from '@oclif/core/lib/interfaces';
import { PROVIDER, DEFAULT_REGIONS, CloudServiceType, cloudServices } from '@stackmate/engine';

import BaseCommand from '@stackmate/cli/core/commands/base';
import { createProject, getRepository } from '@stackmate/cli/core/generator';
import { CURRENT_DIR_BASENAME, DEFAULT_PROJECT_FILE } from '@stackmate/cli/constants';
import { ConfigurationFile, fileExists, parseCommaSeparatedString } from '@stackmate/cli/lib';

class InitCommand extends BaseCommand {
  /**
   * @var {Array} args the command's arguments
   */
  static args = [
    ...BaseCommand.args,
  ];

  /**
   * @var {Object} flags the flags to use in the command
   */
  static flags = {
    ...BaseCommand.flags,
    name: Flags.string({
      char: 'n',
    }),
    services: Flags.string({
      char: 'w',
      default: '',
      required: true,
    }),
    provider: Flags.string({
      char: 'p',
      default: PROVIDER.AWS,
    }),
    region: Flags.string({
      char: 'r',
      default: DEFAULT_REGIONS[PROVIDER.AWS],
    }),
    state: Flags.string({
      default: PROVIDER.AWS,
    }),
    secrets: Flags.string({
      default: PROVIDER.AWS,
    }),
    deploy: Flags.boolean({
      default: true,
    }),
    stages: Flags.string({
      char: 's',
      default: 'production',
    }),
  };

  /**
   * @var {Object} flags the parsed flags
   */
  protected parsedFlags: OutputFlags<typeof InitCommand.flags>;

  async run(): Promise<any> {
    const targetFilePath = DEFAULT_PROJECT_FILE;
    const { name, provider, region, secrets, state, stages, services } = this.parsedFlags;

    if (fileExists(targetFilePath)) {
      const { overwrite } = await inquirer.prompt([{
        type: 'confirm',
        name: 'overwrite',
        message: `File ${targetFilePath} already exists and will be overwritten. Are you sure you want to continue`,
        default: false,
      }]);

      if (!overwrite) {
        this.log('Alright, keeping the existing file then');
        this.exit();
      }
    }

    const { projectName } = await inquirer.prompt([{
      name: 'projectName',
      type: 'input',
      default: kebabCase(name || getRepository() || CURRENT_DIR_BASENAME),
      // validate: (input) =>
    }]);

    const cloudServiceTypes = cloudServices.map(s => s.type);
    let serviceTypes = parseCommaSeparatedString(services).filter(
      s => s in cloudServiceTypes,
    ) as CloudServiceType[];

    if (isEmpty(serviceTypes)) {
      ({ serviceTypes } = await inquirer.prompt([{
        name: 'serviceTypes',
        type: 'checkbox',
        choices: cloudServiceTypes,
      }]));
    }

    const project = createProject({
      projectName,
      defaultProvider: provider,
      defaultRegion: region,
      secretsProvider: secrets,
      stateProvider: state,
      stageNames: parseCommaSeparatedString(stages),
      serviceTypes,
    });

    const projectFile = new ConfigurationFile(targetFilePath);
    projectFile.write(project);

    this.log(`Project file created under ${projectFile.filename}`);
  }
}

export default InitCommand;
