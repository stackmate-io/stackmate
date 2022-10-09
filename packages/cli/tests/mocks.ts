import YAML from 'yaml';
import inquirer, { Answers } from 'inquirer';
import { isError, isString } from 'lodash';
import { Errors, Interfaces } from '@oclif/core';
import { ProjectConfiguration } from '@stackmate/engine';

import ProjectFile from '@stackmate/cli/core/project';
import { DEFAULT_PROJECT_FILE } from '@stackmate/cli/constants';
import { writeFile, fileExists, readFile, createDirectory } from '@stackmate/cli/lib';

type ErrorLike = Error | string | Errors.CLIError | Errors.ExitError;

type CommandOutput = {
  output: string;
  exitCode?: number;
  error?: ErrorLike;
  errorMessage?: string;
};

jest.mock('@stackmate/cli/lib/filesystem', () => {
  const original = jest.requireActual('@stackmate/cli/lib/filesystem');
  return {
    ...original,
    writeFile: jest.fn(),
    fileExists: jest.fn(),
    readFile: jest.fn(),
    createDirectoryMock: jest.fn(),
  };
});

/**
 * @param {Command} CommandClass the command class to execute
 * @param {String[]} args the command's arguments
 * @param {ProjectConfiguration} configuration any project configuration to use
 * @returns {Promise<String>} what the command wrote to stdout
 * @async
 */
export const runCommand = async (
  CommandClass: Interfaces.Command.Class, args: string[], configuration?: ProjectConfiguration
): Promise<CommandOutput> => {
  let output = '';
  let exitCode;
  let errorMessage;
  let error;
  const mocks: jest.SpyInstance[] = [];

  mocks.push(
    jest.spyOn(process.stdout, 'write').mockImplementation(val => {
      output += val.toString();
      return true;
    }),
  );

  mocks.push(
    jest.spyOn(CommandClass.prototype, 'exit').mockImplementation(
      (code: number | undefined) => {
        exitCode = code;
        return Errors.exit(code);
      },
    ),
  );

  if (configuration) {
    mocks.push(...mockProjectConfig(configuration));
  }

  try {
    await CommandClass.run(args);
  } catch (err) {
    if (
      err instanceof Errors.CLIError
      || err instanceof Errors.ExitError
      || isError(err)
      || isString(err)
    ) {
      error = err;
      errorMessage = isString(err) ? err : err.message;
    } else {
      throw err;
    }
  }

  mocks.forEach((mock) => mock.mockRestore());
  return { output, exitCode, errorMessage, error };
};

/**
 * Mocks the inquirer prompt and returns the values passed as arguments.
 * Important: the values should be ordered and separated per prompt.
 *
 * @example Two different prompts that populate objects { a: true, b: false } and { c: 1, d: 2 }
 *          should be passed as different arguments in this function
 *
 * @param {Answers[]} args the answers to the questions prompted by inquirer
 */
export const mockInquirerQuestions = (...args: Answers[]): jest.SpyInstance => {
  const inquirerSpy = jest.spyOn(inquirer, 'prompt');
  args.forEach(answerSet => inquirerSpy.mockReturnValueOnce(Promise.resolve(answerSet)))
  return inquirerSpy;
};

/**
 * @param {ProjectConfiguration} contents the configuration file contents
 * @param {String} filename the file name to use
 * @returns {ProjectFile}
 */
export const mockConfiguration = (
  contents: ProjectConfiguration, filename: string = DEFAULT_PROJECT_FILE,
): ProjectFile => {
  (fileExists as jest.Mock).mockImplementationOnce(() => true);
  (readFile as jest.Mock).mockImplementationOnce(() => YAML.stringify(contents));
  return new ProjectFile(filename);
};

/**
 * @param {String} filename the file name to check
 * @param {Boolean} exists the return value
 * @returns {jest.Mock} the mock instance
 */
export const getFileExistsMock = (filename: string, exists: boolean): jest.Mock => (
  (fileExists as jest.Mock).mockImplementation((fileToCheck: string) => {
    if (fileToCheck !== filename) {
      throw new Error(
        `Mock created with ${filename} as a filename but fileExists was called with ${fileToCheck}`,
      );
    }
    return exists;
  })
);

/**
 * @param {String} filename the file name to write
 * @param {String} contents the file contents to return
 * @returns {jest.Mock} the mock instance
 */
export const getReadFileMock = (filename: string, contents: string): jest.Mock => (
  (readFile as jest.Mock).mockImplementationOnce((fileToRead) => {
    if (fileToRead !== filename) {
      throw new Error(
        `Mock created with ${filename} as a filename but readFile was called with ${fileToRead}`,
      );
    }

    return contents;
  })
);

/**
 * @param {String} filename the file name to write
 * @returns {jest.Mock} the mock instance
 */
export const getWriteFileMock = (filename: string): jest.Mock => (
  (writeFile as jest.Mock).mockImplementationOnce((fileToWrite) => {
    if (fileToWrite !== filename) {
      throw new Error(
        `Mock created with ${filename} as a filename but writeFile was called with ${fileToWrite}`,
      );
    }
  })
);

/**
 * @param {String} dirname the directory name to mock creation for
 * @param {NUmber} mode the filesystem mode to create the directory by
 * @returns {est.Mock} the mock instance
 */
export const createDirectoryMock = (dirname: string, mode: number): jest.Mock => (
  (createDirectory as jest.Mock).mockImplementationOnce((dir: string, mod: number) => {
    if (dir !== dirname) {
      throw new Error(
        `Mock created with ${dirname} as a directory name but was called with ${dir}`,
      );
    }

    if (mod !== mode) {
      throw new Error(
        `Mock created with ${mode} as the directory mode but was called with ${mod}`,
      );
    }
  })
);

/**
 * @param {ProjectConfiguration} config the configuration to return
 */
export const mockProjectConfig = (config: ProjectConfiguration): jest.SpyInstance[] => {
  const existsMock = jest.spyOn(ProjectFile.prototype, 'exists', 'get').mockReturnValue(true);
  const readMock = jest.spyOn(ProjectFile.prototype, 'read').mockReturnValue(config);

  return [existsMock, readMock];
};
