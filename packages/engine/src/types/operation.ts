import { CloudService } from './service';
import { CloudApp, CloudStack, PriorityQueue } from './lib';
import { StackmateProject } from './project';

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
  get provisioner(): Provisionable;
  synthesize(): object;
}

export interface OperationConstructor {
  new (project: StackmateProject, stage: string, options: OperationOptions): StackmateOperation;
}
