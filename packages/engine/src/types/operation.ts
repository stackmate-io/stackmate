import { CloudApp, CloudStack, PriorityQueue } from '@stackmate/engine/types/lib';
import { BaseService } from '@stackmate/engine/types/service';

export type OperationOptions = {
  outputPath?: string;
};

export type PrepareOperationOptions = OperationOptions & {
  statePath?: string;
}

export interface Provisionable {
  readonly app: CloudApp;
  readonly stack: CloudStack;
  readonly queue: PriorityQueue<BaseService.Type>;
  services: BaseService.Type[];
  process(): object;
}

export interface StackmateOperation {
  readonly provisioner: Provisionable;
  readonly services: BaseService.Type[];
  synthesize(): object;
  registerServices(): void;
}
