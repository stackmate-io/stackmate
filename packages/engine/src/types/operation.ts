import { CloudService } from './service';
import { ProjectConfiguration } from './project';
import { CloudApp, CloudStack, PriorityQueue } from './lib';

export type OperationOptions = {
  outputPath?: string;
};

export type PrepareOperationOptions = OperationOptions & {
  statePath?: string;
}

export interface Provisionable {
  readonly app: CloudApp;
  readonly stack: CloudStack;
  readonly queue: PriorityQueue<CloudService>;
  services: CloudService[];
  process(): object;
}

export interface StackmateOperation {
  get services(): CloudService[];
  synthesize(): object;
}

export interface OperationFactory {
  factory<T extends StackmateOperation>(
    this: new (...args: any[]) => T,
    projectConfig: ProjectConfiguration,
    stageName: string,
    options: object,
  ): T;
}
