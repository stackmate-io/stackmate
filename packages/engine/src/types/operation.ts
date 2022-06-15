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
  environment(): EnvironmentVariable[];
  register(...services: BaseService.Type[]): void;
  generate(): object;
}
