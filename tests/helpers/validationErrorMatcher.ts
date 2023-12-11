import { ValidationError } from '@src/index'
import { isFunction, isEmpty, isString } from 'lodash'
import type { ValidationErrorDescriptor } from '@src/index'

export const setupJest = () => {
  expect.extend({
    toThrowValidationError: (
      validationFunction: () => any,
      expected: string | { key: string; message: string },
    ) => {
      if (!isFunction(validationFunction)) {
        throw new Error('You should provide a function that validates data')
      }

      const errors: ValidationErrorDescriptor[] = []

      try {
        validationFunction()
      } catch (err) {
        if (!(err instanceof ValidationError)) {
          return {
            pass: false,
            message: () =>
              `Expected the function to raise a validation error got a different one instead:\n${err}`,
          }
        }

        errors.push(...err.errors)
      }

      if (isEmpty(errors)) {
        return {
          pass: false,
          message: () => 'Expected some validation errors to be present but none was found',
        }
      }

      const pass = isString(expected)
        ? errors.some((error) => error.message.includes(expected))
        : errors.some(
            (error) => expected.key === error.key && error.message?.includes(expected.message),
          )

      return {
        pass,
        message: () =>
          `Expected ${errors.map((err) => `${err.message}`)} to include "${
            isString(expected) ? expected : expected.message
          }"`,
      }
    },
  })
}
