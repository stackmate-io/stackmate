#!/usr/bin/env node
import yargs from 'yargs'
import { ENVIRONMENT } from '@src/project/constants'
import { getProject } from '@src/project'
import type { ArgumentsCamelCase } from 'yargs'

const cli = yargs

type Options = ArgumentsCamelCase<{
  configuration: string
  directory: string
  autoApprove: boolean
  environment: string
}>

const addOperationCommand = (command: 'deploy' | 'destroy' | 'preview') => {
  cli.command({
    command,
    builder: (cmd) => {
      cmd.positional('environment', {
        type: 'string',
        describe: `The environment to ${command}`,
        choices: Object.values(ENVIRONMENT),
      })

      cmd.option('configuration', {
        alias: 'c',
        description: 'the project’s configuration file',
        type: 'string',
        default: '.stackmate/config.yml',
      })

      cmd.option('directory', {
        alias: 'd',
        description: 'the working directory to use',
        type: 'string',
        default: process.cwd(),
      })

      cmd.option('auto-approve', {
        alias: 'y',
        description: 'whether to atuomatically approve the changes introduced',
        type: 'boolean',
        default: false,
      })

      return cmd
    },
    handler: async (options: Options) => {
      const { configuration, directory, autoApprove, environment } = options

      const project = getProject(configuration, environment, directory)

      switch (command) {
        case 'deploy':
          await project.deploy({ autoApprove, stackNames: [environment] })
          break
        case 'destroy':
          await project.destroy({ autoApprove, stackNames: [environment] })
          break
        case 'preview':
          await project.diff({ noColor: true, stackName: environment })
          break
        default:
          throw new Error(`Unknown command ${command}`)
      }
    },
  })
}

addOperationCommand('deploy')
addOperationCommand('destroy')
addOperationCommand('preview')

cli
  .scriptName('stackname')
  .usage(
    `Example usage:
  $0 deploy <environment> [options]
  $0 destroy <environment> [options]
  $0 preview <environment> [options]`,
  )
  .demandCommand(1, 'You need to provide a command to run')
  .showHelpOnFail(false).argv
