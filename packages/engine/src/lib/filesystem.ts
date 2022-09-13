import fs from 'fs';

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

  fs.mkdirSync(path, { recursive: true, mode: 0o700 });
};
