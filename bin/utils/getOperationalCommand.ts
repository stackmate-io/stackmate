import path from 'node:path'
import { ENVIRONMENT } from '@src/project/constants'
import { readJsonFile, readYamlFile } from '@src/lib/file'
import type { ProjectConfiguration } from '@src/project'
import type { CommandModule, ArgumentsCamelCase } from 'yargs'
import { getProject } from './getProject'

type Options = ArgumentsCamelCase<{
  configuration: string
  directory: string
  autoApprove: boolean
  environment: string
}>

export const getOperationalCommand = (
  command: 'deploy' | 'destroy' | 'preview',
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
