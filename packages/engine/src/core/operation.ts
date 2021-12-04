import Project from '@stackmate/core/project';
import Vault from '@stackmate/core/vault';
import Provisioner from '@stackmate/core/provisioner';
import { STORAGE } from '@stackmate/core/constants';

class Operation {
  protected readonly projectPath: string;
  protected readonly stage: string

  protected project: Project;

  protected vault: Vault;

  protected provisioner: Provisioner;

  constructor(projectPath: string, stage: string) {
    this.projectPath = projectPath;
    this.stage = stage;
  }

  async init() {
    this.project = new Project({ path: this.projectPath, storage: STORAGE.FILE });
    // await this.project.load();

    // const { contents: { vault: { storage = STORAGE.FILE, ...vaultOptions } = {} } } = this.project;

    // this.vault = new Vault(this.stage, { storage, ...(vaultOptions || {}) });
    // await this.vault.load();

    // this.provisioner = new Provisioner(this.project, this.stage, this.vault.contents);
  }
}

export default Operation;
