import { ArgInput } from '@oclif/core/lib/interfaces';

import ProjectFile from '@stackmate/cli/core/project';
import { StageNotFoundError } from '@stackmate/cli/lib';
import { DEFAULT_PROJECT_FILE } from '@stackmate/cli/constants';
import BaseCommand, { BaseCommandClass } from '@stackmate/cli/core/commands/base';
import { ProjectConfiguration, StageConfiguration } from '@stackmate/engine';

export type CommandWithProject = BaseCommand & {
  get selectedStage(): string;
  get configFile(): ProjectFile;
  get projectConfig(): ProjectConfiguration;
  get selectedStageConfig(): StageConfiguration<true>;
  getStage(name: string): StageConfiguration<true>;
};

type CommandWithProjectConstructor = abstract new (...args: any[]) => CommandWithProject;

export type CommandWithProjectClass = CommandWithProjectConstructor & BaseCommandClass

export const withProject = (Base: BaseCommandClass): CommandWithProjectClass => {
  abstract class ProjectCommand extends Base implements CommandWithProject {
    /**
     * @var {String} filename the configuration's filename
     */
    protected filename: string = DEFAULT_PROJECT_FILE;

    /**
     * @var {Array} args the command's arguments
     */
    static args: ArgInput = [
      ...Base.args,
      {
        name: 'stage',
        description: 'The stage to synthesize',
        required: true,
        parse: async (input: string) => (input || '').trim(),
      },
    ];

    /**
     * @var {ProjectConfiguration} config the configuration object
     */
    #config: ProjectFile;

    /**
     * @returns {ProjectFile} the configuration file associated with this command
     */
    get configFile(): ProjectFile {
      if (!this.#config) {
        this.#config = new ProjectFile(this.filename);
      }

      return this.#config;
    }

    /**
     * @returns {ProjectConfiguration} the project configuration to load from the file
     */
    get projectConfig(): ProjectConfiguration {
      this.assertConfigExists();
      return this.configFile.read() as ProjectConfiguration;
    }

    /**
     * Asserts that a configuration file exists
     */
    protected assertConfigExists() {
      if (this.configFile.exists) {
        return;
      }

      this.log('Stackmate configuration not found. Use the `init` command to create one');
      this.exit(1);
    }

    /**
     * @returns {String} the stage's name
     */
    get selectedStage(): string {
      return this.parsedArgs.stage;
    }

    /**
     * Returns the configuration for a given stage
     *
     * @param {String} name the stage's name
     * @returns {StageConfiguration} the stage's configuration
     */
    getStage(name: string): StageConfiguration<true> {
      const stage = (this.projectConfig.stages || []).find(stg => stg.name === name);
      if (!stage) {
        throw new StageNotFoundError(name);
      }

      return stage;
    }

    /**
     * @returns {StageConfiguration} the configuration for the selected (via args) stage
     */
    get selectedStageConfig(): StageConfiguration<true> {
      return this.getStage(this.selectedStage);
    }
  }

  return ProjectCommand;
};

export const BaseCommandWithProject = withProject(BaseCommand);
