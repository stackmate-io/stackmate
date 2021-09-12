export class ValidationError extends Error {
  errors: object;

  constructor(message: string, errors: object) {
    super(message);

    this.errors = errors;
  }
}
