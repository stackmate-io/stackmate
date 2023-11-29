import path from 'node:path'
import { ENVIRONMENT } from '@src/project/constants'
import { readJsonFile, readYamlFile } from '@src/lib/file'
import type { CommandModule, ArgumentsCamelCase } from 'yargs'
import type { DiffOptions, MutationOptions } from '@cdktf/cli-core/src/lib/cdktf-project'
import type { ProjectConfiguration } from '@src/project'
import { getProject } from './getProject'

type Options = ArgumentsCamelCase<{
  configuration: string
  directory: string
  environment: string
}>

export const getOperationalCommand = (
  command: 'deploy' | 'destroy' | 'preview',
  operationDefaults: DiffOptions | MutationOptions = {
    autoApprove: true,
    migrateState: true,
    noColor: true,
  },
): CommandModule => ({
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

    return cmd
  },
  handler: async (options: Options) => {
    const { configuration, directory, environment } = options

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
        await project.deploy(operationDefaults)
        break
      case 'destroy':
        await project.destroy(operationDefaults)
        break
      case 'preview':
        await project.diff(operationDefaults)
        break
      default:
        throw new Error(`Unknown command ${command}`)
    }
  },
})
