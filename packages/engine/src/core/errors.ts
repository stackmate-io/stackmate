import chalk from 'chalk';

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

  /**
   * @returns {String} the formatted error message
   */
  formatted(): string {
    let formatted: string = `${chalk.red(this.message)}\n\n`;

    Object.keys(this.errors).forEach((errorKey: string) => {
      const messages = this.errors[errorKey].map(err => `\t\t${err}`).join('\n');
      const intro = `Wrong configuration for the “${errorKey}” key“`;
      formatted += `\t${chalk.yellow(intro)}: \n${messages}\n`;
    });

    return formatted;
  }
}
