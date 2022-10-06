import YAML from 'yaml';
import { Errors, Interfaces } from '@oclif/core';
import { ProjectConfiguration } from '@stackmate/engine';

import { ConfigurationFile } from '@stackmate/cli/lib';
import { DEFAULT_PROJECT_FILE } from '@stackmate/cli/constants';
import * as fileHelpers from '@stackmate/cli/lib';
import inquirer, { Answers } from 'inquirer';
import { isError, isString } from 'lodash';

type ErrorLike = Error | string | Errors.CLIError | Errors.ExitError;

type CommandOutput = {
  output: string;
  exitCode?: number;
  error?: ErrorLike;
  errorMessage?: string;
};

/**
 * @param {Command} CommandClass the command class to execute
 * @param {String[]} args the command's arguments
 * @returns {Promise<String>} what the command wrote to stdout
 * @async
 */
export const runCommand = async (
  CommandClass: Interfaces.Command.Class, args: string[],
): Promise<CommandOutput> => {
  let output = '';
  let exitCode;
  let errorMessage;
  let error;

  const stdOutMock = jest.spyOn(process.stdout, 'write').mockImplementation(val => {
    output += val.toString();
    return true;
  });

  const exitMock = jest.spyOn(CommandClass.prototype, 'exit').mockImplementation(
    (code: number | undefined) => {
      exitCode = code;
      return Errors.exit(code);
    },
  );

  try {
    await CommandClass.run(args);
  } catch (err) {
    if (err instanceof Errors.CLIError || err instanceof Errors.ExitError || isError(err) || isString(err)) {
      error = err;
      errorMessage = isString(err) ? err : err.message;
    } else {
      throw err;
    }
  }

  stdOutMock.mockRestore();
  exitMock.mockRestore();

  return { output, exitCode, errorMessage, error };
};

export const mockInquirerQuestions = (...args: Answers[]) => {
  const inquirerMock = jest.spyOn(inquirer, 'prompt');
  args.forEach(answerSet => inquirerMock.mockReturnValueOnce(Promise.resolve(answerSet)))
};

export const mockConfiguration = (
  contents: ProjectConfiguration, filename: string = DEFAULT_PROJECT_FILE,
): ConfigurationFile => {
  const existsMock = jest.spyOn(fileHelpers, 'fileExists').mockImplementation(() => true);
  const readMock = jest.spyOn(fileHelpers, 'readFile').mockImplementation(
    () => YAML.stringify(contents),
  );

  const cfg = new ConfigurationFile(filename);

  existsMock.mockRestore();
  readMock.mockRestore();

  return cfg;
};
