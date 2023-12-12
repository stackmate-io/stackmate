/* eslint-disable no-console */
import { inspect } from 'util'
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
        errors.forEach((error) => {
          const prefix = error.key.match(/[a-zA-Z]/)
            ? `Property "${error.key}" contains invalid value ${inspect(error.value)}: it`
            : 'It'
          print(`• ${prefix} ${error.message}`, 4)
        })
      },
    )

    process.exit(1)
  }

  if (isDebugMode) {
    throw err
  }

  print(`❌ Stackmate wasn't able to proceed, there was an unexpected error`)
  if (err instanceof Error) {
    print(err.message, 2)
  }

  process.exit(1)
}
