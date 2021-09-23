import path from 'path';
import Provisioner from '@stackmate/core/provisioner';
import Configuration from '@stackmate/core/configuration';
import { STORAGE } from '@stackmate/core/constants';

class Project {
  /**
   * @var {String} DEFAULT_PATH the path for the project file to use
   */
  static DEFAULT_PATH: string = path.join(process.cwd(), '.stackmate', 'config.yml');

  /**
   * @var {Configuration} configuration the project's configuration
   * @readonly
   */
  readonly configuration: Configuration;

  /**
   * @var {Provisioner} _provisioner the project's provisioner
   */
  private _provisioner: Provisioner;

  constructor(path: string = Project.DEFAULT_PATH, storage: string = STORAGE.FILE ) {
    this.configuration = new Configuration(path, storage);
  }

  async load() {
    await this.configuration.load();

    // const {
    //   state: { path: statePath, storage: stateStorage } = {},
    //   vault: { path: vaultPath, storage: vaultStorage } = {},
    // } = this.configuration.contents;
    //
    // this.state = new State(statePath, storage);
    // this.vault = new Vault(vaultPath, storage);
    // await Promise.all([this.state.load(), this.vault.load()])
  }

  /**
   * Populates the services in the provisioner
   *
   * @param {String} stageName The stage to provision
   * @returns {Provisioner} the provisioner, having the services populated
   */
  use(stageName: string): Provisioner {
    if (!this.configuration.stages[stageName]) {
      throw new Error(
        `Stage ${stageName} was not found in the project. Available options are ${Object.keys(this.configuration.stages)}`,
      );
    }

    this._provisioner = new Provisioner(
      stageName, this.configuration.stages[stageName], this.configuration.defaults,
    );

    return this._provisioner;
  }

  /**
   * Deploys a stage to the cloud
   *
   * @param {String} stageName the stage to deploy
   * @async
   */
  async deploy(stageName: string) {
    await this.use(stageName).deploy();
  }
}

/*
Usage:
const project = new Project();
await project.load();
await project.deploy('production');
*/

export default Project;
