/* eslint-disable no-console */
import { spawn } from 'node:child_process'
import { dirname } from 'node:path'
import { isEmpty } from 'lodash'

export const execute = async (
  command: string[],
  {
    env = process.env,
    cwd = require.main?.filename ? dirname(require.main?.filename) : process.cwd(),
    onData = (data: string) => console.log(data),
    onError = (error: string) => console.error(error),
  }: {
    cwd?: string | URL | undefined
    env?: NodeJS.ProcessEnv | undefined
    onData?: (data: string) => void
    onError?: (error: string) => void
  } = {},
): Promise<{ code: number; errors?: string[] }> =>
  new Promise((resolve, reject) => {
    const [executable, ...args] = command
    const child = spawn(executable, args, { cwd, env })

    child.stdout.setEncoding('utf8')
    child.stdout.on('data', (data) => onData(data.toString()))

    const errors: string[] = []
    child.stderr.setEncoding('utf8')
    child.stderr.on('data', function (data) {
      const str = data.toString()
      onError(str)
      errors.push(str)
    })

    child.on('close', (code) => {
      if (code === 0 && isEmpty(errors)) {
        return resolve({ code })
      }

      return reject({ code, errors })
    })
  })
