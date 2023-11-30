import path from 'node:path'
import { ENVIRONMENT } from '@src/project/constants'
import { readJsonFile, readYamlFile } from '@src/lib/file'
import type { CommandModule, ArgumentsCamelCase } from 'yargs'
import type { DiffOptions, MutationOptions } from '@cdktf/cli-core/src/lib/cdktf-project'
import type { ProjectConfiguration } from '@src/project'
import { getProject } from './getProject'
import { handleTerraformOutput } from './handleTerraformOutput'

export type CliCommandChoice = 'deploy' | 'destroy' | 'preview'

export type CliOptions = ArgumentsCamelCase<{
  configuration: string
  directory: string
  environment: string
  colors: boolean
}>

export const getOperationalCommand = (
  command: CliCommandChoice,
  operationDefaults: DiffOptions | MutationOptions = {
    autoApprove: true,
    migrateState: true,
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

    cmd.option('colors', {
      description: 'whether to use colors for the output',
      type: 'boolean',
      default: true,
    })

    return cmd
  },
  handler: async (options: CliOptions) => {
    const { configuration, directory, environment, colors } = options
    const operationOptions: DiffOptions | MutationOptions = {
      ...operationDefaults,
      noColor: !Boolean(colors),
    }

    const contents =
      configuration.endsWith('.yml') || configuration.endsWith('.yaml')
        ? readYamlFile(configuration)
        : readJsonFile(configuration)

    const project = getProject(contents as ProjectConfiguration, environment, {
      workingDirectory: directory || path.dirname(configuration),
      onLog: handleTerraformOutput,
      onUpdate: handleTerraformOutput,
    })

    const quitTerraform = () => project.hardAbort()

    process.on('SIGINT', quitTerraform)
    process.on('SIGTERM', quitTerraform)
    process.on('SIGQUIT', quitTerraform)

    switch (command) {
      case 'deploy':
        await project.deploy(operationOptions)
        break
      case 'destroy':
        await project.destroy(operationOptions)
        break
      case 'preview':
        await project.diff(operationOptions)
        break
      default:
        throw new Error(`Unknown command ${command}`)
    }
  },
})
