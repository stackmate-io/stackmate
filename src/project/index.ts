import path from 'path'
import { readJsonFile, readYamlFile } from '@src/lib/file'
import { getProjectServices } from '@src/project/utils/getProjectServices'
import { Operation } from '@src/operation'
import { Project } from '@src/project'
import { ENVIRONMENT } from '@src/project/constants'
import type { ProjectConfiguration } from '@src/project/types'

export * from './project'
export * from './types'

export const getProject = (
  file: string,
  environment: string = ENVIRONMENT.PRODUCTION,
  workingDirectory?: string,
): Project => {
  if (!file) {
    throw new Error('No filename provided')
  }

  const contents = (
    file.endsWith('.yml') || file.endsWith('.yaml') ? readYamlFile(file) : readJsonFile(file)
  ) as ProjectConfiguration

  const services = getProjectServices(contents, environment)
  const operation = new Operation(services, environment, process.env)

  return new Project(operation.process(), {
    workingDirectory: workingDirectory || path.dirname(file),
    onUpdate: (update) => console.log('update:', update),
    onLog: (log) => console.log('log:', log),
  })
}
