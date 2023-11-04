import { faker } from '@faker-js/faker'
import { ValidationError, ValidationErrorDescriptor, EnvironmentValidationError } from '@lib/errors'

describe('ValidationError', () => {
  let message: string
  let subject: ValidationError
  let errors: ValidationErrorDescriptor[]

  beforeEach(() => {
    message = faker.lorem.sentence()
    errors = [
      {
        message: faker.lorem.sentence(),
        path: faker.system.directoryPath(),
      }
    ]

    subject = new ValidationError(message, errors)
  })

  it('provides a message', () => {
    expect(subject.message).toEqual(message)
  })

  it('provides the errors', () => {
    expect(subject.errors).toEqual(errors)
  })
})

describe('EnvironmentValidationError', () => {
  let subject: EnvironmentValidationError
  let message: string
  let vars: string[]

  beforeEach(() => {
    message = faker.lorem.sentence()
    vars = faker.lorem.words(4).split(' ').map(w => w.toUpperCase())

    subject = new EnvironmentValidationError(message, vars)
  })

  it('provides a message', () => {
    expect(subject.message).toEqual(message)
  })

  it('provides the variables', () => {
    expect(subject.vars).toEqual(vars)
  })
})
