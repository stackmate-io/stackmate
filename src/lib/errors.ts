/* eslint-disable max-classes-per-file */
export type ValidationErrorDescriptor = {
  key: string
  value: string
  path: string
  message: string
  parent: any
}

export class ValidationError extends Error {
  readonly errors: ValidationErrorDescriptor[] = []

  constructor(message: string, errors: ValidationErrorDescriptor[]) {
    super(message)
    this.errors = errors
  }
}

export class EnvironmentValidationError extends Error {
  readonly vars: string[] = []

  constructor(message: string, vars: string[]) {
    super(message)
    this.vars = vars
  }
}
