import fs from 'node:fs';
import path from 'node:path';
import { DirectoryNotWriteableError, FileDoesNotExistError, FileNotWriteableError } from './errors';

export type FileStorage = {
  readonly filename: string;
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
 * @void
 */
export const createDirectory = (path: string): void => {
  const exists = fs.existsSync(path);

  if (exists && !fs.statSync(path).isDirectory()) {
    throw new Error(`Path ${path} already exists and it's not a directory`);
  }

  try {
    fs.mkdirSync(path, { recursive: true, mode: 0o700 });
  } catch (error) {
    throw new DirectoryNotWriteableError(path);
  }
};

export const fileExists = (filename: string): boolean => (
  fs.existsSync(filename)
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
)
