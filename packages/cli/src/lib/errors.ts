namespace FileErrors {
  export abstract class FileError extends Error {
    /**
     * @var {String} path the faulty path that is associated to the error
     */
    path: string;
  }

  export class FileDoesNotExistError extends FileError {
    /**
     * @constructor
     * @param {String} filename the file's name
     */
    constructor(filename: string) {
      super(`File ${filename} does not exist`);
      this.path = filename;
    }
  }

  export class FileNotReadableError extends FileError {
    /**
     * @constructor
     * @param {String} filename the file's name
     */
    constructor(filename: string) {
      super(`File ${filename} is not readable`);
      this.path = filename;
    }
  }

  export class FileNotWriteableError extends FileError {
    /**
     * @constructor
     * @param {String} filename the file's name
     */
    constructor(filename: string) {
      super(`File ${filename} is not writeable`);
      this.path = filename;
    }
  }

  export class DirectoryNotWriteableError extends FileError {
    /**
     * @constructor
     * @param {String} path the file's name
     */
    constructor(path: string) {
      super(`We can't create ${path}, please make sure you have the necessary permissions`);
      this.path = path;
    }
  }
}

export {
  FileErrors,
};
