import inquirer from 'inquirer';
import { Flags } from '@oclif/core';
import { isEmpty, kebabCase } from 'lodash';
import { ArgInput, OutputFlags } from '@oclif/core/lib/interfaces';
import { PROVIDER, DEFAULT_REGIONS, cloudServices, validateProperty, ServiceTypeChoice } from '@stackmate/engine';

import BaseCommand from '@stackmate/cli/core/commands/base';
import { createProject, getRepository } from '@stackmate/cli/core/generator';
import { CURRENT_DIR_BASENAME, DEFAULT_PROJECT_FILE } from '@stackmate/cli/constants';
import { ConfigurationFile, fileExists, isValidOrError, parseCommaSeparatedString } from '@stackmate/cli/lib';

class InitCommand extends BaseCommand {
  /**
   * @var {Array} args the command's arguments
   */
  static args: ArgInput = [
    ...BaseCommand.args,
  ];

  /**
   * @var {String} summary the command's short description
   */
  static summary = 'Generates the stackmate configuration file.';

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
    const {
      name, provider, region, secrets, state, stages = '', services = '',
    } = this.parsedFlags;

    if (fileExists(targetFilePath)) {
      const { overwrite = false } = await inquirer.prompt([{
        type: 'confirm',
        name: 'overwrite',
        message: `File ${targetFilePath} already exists and will be overwritten. Are you sure you want to continue`,
        default: false,
      }]);

      if (!overwrite) {
        this.log('Alright, keeping the existing file then, will now exit');
        this.exit();
      }
    }

    const cloudServiceTypes = cloudServices.map(s => s.type);
    const filterServiceTypes = (t: ServiceTypeChoice) => cloudServiceTypes.includes(t);
    const filterStageNames = (t: string) => !isEmpty(t);

    const { projectName, serviceTypes, stageNames } = await inquirer.prompt([{
      name: 'projectName',
      type: 'input',
      message: 'What’s the name of the project?',
      default: kebabCase(name || getRepository() || CURRENT_DIR_BASENAME),
      askAnswered: isEmpty(name),
      validate: (input) => isValidOrError(() => validateProperty('name', input)),
    }, {
      type: 'checkbox',
      name: 'serviceTypes',
      choices: cloudServiceTypes,
      message: 'Provide the services to deploy',
      filter: async (types: ServiceTypeChoice[]) => (
        (types || []).filter(t => cloudServiceTypes.includes(t))
      ),
      askAnswered: isEmpty(services),
      validate: (types: string[]) => (
        !types.length ? 'You must choose at least one service' : true
      ),
    }, {
      type: 'list',
      name: 'stageNames',
      askAnswered: isEmpty(stages),
      filter: async (input) => !isEmpty(input),
      validate: (stages: string[]) => isValidOrError(() => (
        stages.every(
          (s) => validateProperty('stages/items/properties/name', s),
        )
      )),
    }], {
      projectName: name,
      serviceTypes: parseCommaSeparatedString(services).filter(filterServiceTypes),
      stageNames: parseCommaSeparatedString(stages).filter(filterStageNames),
    });

    if (isEmpty(stageNames) || isEmpty(serviceTypes) || isEmpty(projectName)) {
      this.log('No configuration provided, you need to re-run this command. Will now exit')
    }

    const project = createProject({
      projectName,
      defaultProvider: provider,
      defaultRegion: region,
      secretsProvider: secrets,
      stateProvider: state,
      stageNames,
      serviceTypes,
    });

    const projectFile = new ConfigurationFile(targetFilePath);
    projectFile.write(project);

    this.log(`Project file created under ${projectFile.filename}`);
  }
}

export default InitCommand;
