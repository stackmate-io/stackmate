import fs from 'node:fs';
import path from 'node:path';
import { CURRENT_DIRECTORY } from '@stackmate/cli/constants';
import { DirectoryNotWriteableError, FileDoesNotExistError, FileNotWriteableError } from './errors';

export type FileStorage = {
  readonly filename: string;
  get raw(): string;
  read(): object;
  write(contents: object): void;
};

const hasFileSystemAccess = (path: string, mode: number): boolean => {
  try {
    fs.accessSync(path, mode);
    return true;
  } catch (err) {
    return false;
  }
};

/**
 * Creates a directory if it doesn't exist
 *
 * @param {String} path the path to create (if doesn't exist)
 * @param {Number} mode the mode for the directory (default 755)
 * @void
 */
export const createDirectory = (path: string, mode: number = 0o755): void => {
  const exists = fs.existsSync(path);

  if (exists && !fs.statSync(path).isDirectory()) {
    throw new Error(`Path ${path} already exists and it's not a directory`);
  } else {
    fs.chmodSync(path, mode);
  }

  try {
    fs.mkdirSync(path, { recursive: true, mode });
  } catch (error) {
    throw new DirectoryNotWriteableError(path);
  }
};

export const fileExists = (filename: string): boolean => (
  fs.existsSync(filename)
);

export const directoryExists = (dirname: string): boolean => (
  fs.existsSync(dirname) && fs.statSync(dirname).isDirectory()
);

export const resolveRelativePath = (...parts: string[]): string => (
  path.resolve(CURRENT_DIRECTORY, ...parts)
);

export const isFileReadable = (filename: string): boolean => (
  hasFileSystemAccess(filename, fs.constants.R_OK)
);

export const isParentDirWriteable = (filename: string): boolean => (
  hasFileSystemAccess(path.dirname(filename), fs.constants.W_OK)
);

export const isFileWriteable = (filename: string): boolean => {
  if (!fileExists(filename)) {
    return isParentDirWriteable(filename);
  }

  return hasFileSystemAccess(filename, fs.constants.W_OK);
};

export const readFile = (filename: string): string => {
  if (!isFileReadable(filename)) {
    throw new FileDoesNotExistError(filename);
  }

  return fs.readFileSync(filename).toString();
};

export const writeFile = (filename: string, content: string): void => {
  createDirectory(path.dirname(filename));

  if (!isFileWriteable(filename)) {
    throw new FileNotWriteableError(filename);
  }

  fs.writeFileSync(filename, content);
};

export const getFileExtension = (filename: string): string => (
  path.extname(filename).toLowerCase()
);
