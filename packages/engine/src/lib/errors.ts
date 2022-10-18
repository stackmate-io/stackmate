/**
 * @type {ValidationErrorDescriptor} describes a Validation Error entry
 */
export type ValidationErrorDescriptor = {
  path: string;
  message: string;
};

/**
 * @class ValidationError
 */
export class ValidationError extends Error {
  readonly errors: ValidationErrorDescriptor[] = [];

  constructor(message: string, errors: ValidationErrorDescriptor[]) {
    super(message);
    this.errors = errors;
  }
}

/**
 * @class EnvironmentValidationError
 */
export class EnvironmentValidationError extends Error {
  readonly vars: string[] = [];

  constructor(message: string, vars: string[]) {
    super(message);
    this.vars = vars;
  }
}
