export interface FileFormatter {
  serialize(contents: object): string;
  deserialize(contents: string): object;
}

export interface FileReader {
  readonly filename: string;
  read(): object;
  write(contents: object): void;
}
