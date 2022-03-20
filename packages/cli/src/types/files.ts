export interface FileFormatter {
  serialize(contents: object): string;
  deserialize(contents: string): object;
}

export interface FileStorage {
  readonly filename: string;
  read(): object;
  write(contents: object): void;
}
