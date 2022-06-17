import { CloudStack } from '@stackmate/engine/types/lib';
import { BaseService } from '@stackmate/engine/types/service';

export type OperationOptions = {
  outputPath?: string;
};

export type PrepareOperationOptions = OperationOptions & {
  statePath?: string;
}

export type EnvironmentVariable = {
  name: string;
  description: string;
}

export interface StackProvisioner {
  readonly stack: CloudStack;
  environment(): EnvironmentVariable[];
  register(...services: BaseService.Type[]): void;
  synthesize(): object;
}
