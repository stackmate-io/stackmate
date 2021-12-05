import { isEmpty } from 'lodash';

import { validate } from '@stackmate/lib/validation';
import { Validatable } from '@stackmate/interfaces';
import { Validations } from '@stackmate/types';
import { ValidationError } from '@stackmate/lib/errors';

abstract class Entity implements Validatable {
  /**
   * @returns {Validations} the validations to use in the entity
   */
  public abstract validations(): Validations;

  /**
   * Get the validation error message to display when the entity isn't valid
   *
   * @param {Object} attributes the entity's attributes
   * @returns {String} the error message
   */
  public abstract getValidationError(attributes: object): string;

  /**
   * Validates an entity's attributes
   *
   * @param {Object} attributes the entity's attributes to be validated
   * @throws {ValidationError} when the attributes are invalid
   * @void
   */
  validate(attributes: object): void {
    const errors = validate.validate(attributes, this.validations(), { fullMessages: false });

    if (!isEmpty(errors)) {
      throw new ValidationError(this.getValidationError(attributes), errors);
    }
  }
}

export default Entity;
