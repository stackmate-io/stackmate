/* eslint-disable max-classes-per-file */
import { ValidationErrorList } from '@stackmate/engine/types';
import { DEBUG_MODE } from '@stackmate/engine/constants';

/**
 * Custom validation error
 *
 * @extends {Error}
 */
export class ValidationError extends Error {
  errors: ValidationErrorList;

  constructor(message: string, errors: ValidationErrorList = {}) {
    let msg = message;

    if (DEBUG_MODE) {
      // More elaborate output for debug mode
      Object.keys(errors).forEach(key => {
        msg += `\n\t${key}: ${errors[key].join("\n\t\t")}`;
      });
    }

    super(msg);

    this.errors = errors;
  }
}

export class ProfileNotFoundError extends Error {
  constructor(profileName: string) {
    super(`The profile ${profileName} was not found in the system`);
  }
}
