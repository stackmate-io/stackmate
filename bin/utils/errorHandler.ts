/* eslint-disable no-console */
import { ValidationError } from '@lib/errors'
import { isDebugMode } from '@src/constants'
import { groupBy } from 'lodash'

const print = (message: string, indentation = 0) => {
  const spacing = Array(indentation).fill(' ').join('')
  console.error(`${spacing}${message}`)
}

export const errorHandler = (msg: string, err: Error) => {
  if (msg) {
    print(msg)
  }

  if (err instanceof ValidationError) {
    print(`❌ Your project configuration is invalid`)

    Object.entries(groupBy(err.errors, (err) => err.parent.name)).forEach(
      ([serviceName, errors]) => {
        print(`Service "${serviceName} contains the following errors:"`, 2)
        errors.forEach((error) =>
          print(
            `• Property "${error.key}" contains invalid value "${error.value.toString()}": it ${
              error.message
            }`,
            4,
          ),
        )
      },
    )
  }

  if (isDebugMode) {
    throw err
  }

  process.exit(1)
}
