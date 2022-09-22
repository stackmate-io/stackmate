import { CloudProviderChoice, ServiceTypeChoice } from '@stackmate/engine';

export type PreferenceOptions = {
  version: string;
  defaultProvider: CloudProviderChoice;
  defaultRegion: string;
};

export interface FileFormatter {
  serialize(contents: object): string;
  deserialize(contents: string): object;
}

export interface FileStorage {
  readonly filename: string;
  exists: boolean;
  readable: boolean;
  directoryWriteable: boolean;
  read(): object;
  write(contents: object): void;
}

export type ProjectConfigCreationOptions = {
  projectName: string,
  defaultProvider?: CloudProviderChoice,
  defaultRegion?: string,
  stageNames?: string[],
  stateProvider?: CloudProviderChoice,
  secretsProvider?: CloudProviderChoice,
  serviceTypes?: ServiceTypeChoice[],
};
