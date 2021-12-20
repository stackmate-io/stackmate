import { ValidationErrorList } from '@stackmate/types';

/**
 * Custom validation error
 *
 * @extends {Error}
 */
export class ValidationError extends Error {
  errors: ValidationErrorList;

  constructor(message: string, errors: ValidationErrorList = {}) {
    super(message);

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
