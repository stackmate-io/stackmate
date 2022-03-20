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
