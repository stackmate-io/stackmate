#!/usr/bin/env node
import path from 'node:path'
import yargs from 'yargs'
import { ENVIRONMENT } from '@src/project/constants'
import { getProject } from '@src/project'
import { readJsonFile, readYamlFile } from '@src/lib/file'
import type { ProjectConfiguration } from '@src/project'
import type { ArgumentsCamelCase } from 'yargs'

export const cli = yargs

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
        default: '',
      })

      cmd.option('auto-approve', {
        alias: 'y',
        description: 'whether to atuomatically approve the changes introduced',
        type: 'boolean',
        default: true,
      })

      return cmd
    },
    handler: async (options: Options) => {
      const { configuration, directory, autoApprove, environment } = options

      const contents =
        configuration.endsWith('.yml') || configuration.endsWith('.yaml')
          ? readYamlFile(configuration)
          : readJsonFile(configuration)

      const project = getProject(contents as ProjectConfiguration, environment, {
        workingDirectory: directory || path.dirname(configuration),
        onLog(log) {
          console.log({ ...log, action: 'log' })
        },
        onUpdate(update) {
          console.log({ ...update, action: 'update' })
        },
      })

      switch (command) {
        case 'deploy':
          await project.deploy({ autoApprove })
          break
        case 'destroy':
          await project.destroy({ autoApprove })
          break
        case 'preview':
          await project.diff({ noColor: true })
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

const usage = `Example usage:
$0 deploy <environment> [options]
$0 destroy <environment> [options]
$0 preview <environment> [options]`

cli
  .scriptName('stackname')
  .usage(usage)
  .demandCommand(1, 'You need to provide a command to run')
  .showHelpOnFail(false).argv
