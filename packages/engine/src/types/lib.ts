import { App as TerraformApp, TerraformStack } from 'cdktf';

export type CredentialsObject = {
  username?: string;
  password?: string;
};

export interface CloudStack extends TerraformStack {
  readonly name: string;
  readonly app: TerraformApp;
  readonly appName: string;
  readonly outputPath: string;
}

export interface CloudApp extends TerraformApp {
  readonly name: string;
  stack(name: string): CloudStack;
}

export interface SubclassRegistry<T> {
  items: Map<string, T>;
  get(attributes: object): T | undefined;
  add(classConstructor: T, ...attrs: string[]): void;
}
