namespace FileErrors {
  export class FileDoesNotExistError extends Error {
    /**
     * @var {String} filename the file's name
     */
    filename: string;

    /**
     * @constructor
     * @param {String} filename the file's name
     */
    constructor(filename: string) {
      const msg = `File ${filename} does not exist`;
      super(msg);

      this.filename = filename;
    }
  }

  export class FileNotReadableError extends Error {
    /**
     * @var {String} filename the file's name
     */
    filename: string;

    /**
     * @constructor
     * @param {String} filename the file's name
     */
    constructor(filename: string) {
      const msg = `File ${filename} is not readable`;
      super(msg);

      this.filename = filename;
    }
  }

  export class FileNotWriteableError extends Error {
    /**
     * @var {String} filename the file's name
     */
    filename: string;

    /**
     * @constructor
     * @param {String} filename the file's name
     */
    constructor(filename: string) {
      const msg = `File ${filename} is not writeable`;
      super(msg);

      this.filename = filename;
    }
  }

  export class DirectoryNotWriteableError extends Error {
    /**
     * @var {String} path the file's name
     */
    path: string;

    /**
     * @constructor
     * @param {String} path the file's name
     */
    constructor(path: string) {
      const msg = `We can't create ${path}, please make sure you have the necessary permissions`;
      super(msg);

      this.path = path;
    }
  }
}

export {
  FileErrors,
};
