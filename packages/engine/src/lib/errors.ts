/* eslint-disable max-classes-per-file */
import { ValidationErrorList } from '@stackmate/engine/types';

/**
 * Custom validation error
 *
 * @extends {Error}
 */
export class ValidationError extends Error {
  errors: ValidationErrorList;

  constructor(message: string, errors: ValidationErrorList = {}) {
    let msg = message;

    Object.keys(errors).forEach(key => {
      msg += `\n\t${key}: ${errors[key].join("\n\t\t")}`;
    });

    super(msg);

    this.errors = errors;
  }
}

export class EnvironmentVariableUndefinedError extends Error {
  variable: string;

  constructor(variable: string) {
    const message = `The environment variable ${variable} is undefined and needs to be exported`;
    super(message);

    this.variable = variable;
  }
}

export class ProfileNotFoundError extends Error {
  constructor(profileName: string) {
    super(`The profile ${profileName} was not found in the system`);
  }
}
