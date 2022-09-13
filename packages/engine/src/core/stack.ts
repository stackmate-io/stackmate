import { TerraformStack, App as TerraformApp, AppOptions } from 'cdktf';

export interface Stack {
  readonly app: TerraformApp;
  readonly context: TerraformStack,
  readonly projectName: string;
  readonly stageName: string;
  readonly provisions: object[];
  hasProvisionsFor(a: object): boolean;
  markProvisioned(a: object): void;
};

class StageStack implements Stack {
  readonly id: string;

  readonly app: TerraformApp;

  readonly context: TerraformStack;

  readonly projectName: string;

  readonly stageName: string;

  readonly provisions: object[];

  constructor(projectName: string, stageName: string, options?: AppOptions) {
    this.projectName = projectName;
    this.stageName = stageName;
    this.app = new TerraformApp();
    this.id = `${this.projectName}/${this.stageName}`;
    this.context = new TerraformStack(this.app, this.id);
  }

  hasProvisionsFor(a: object): boolean {
    return true;
  }

  markProvisioned(a: object): void {
  }
}

export const getStack = (projectName: string, stageName: string, options?: AppOptions): Stack => (
  new StageStack(projectName, stageName, options)
);
