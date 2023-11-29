import { getProjectServices } from '@src/project/utils/getProjectServices'
import { Operation } from '@src/operation'
import { Project } from '@src/project'
import { ENVIRONMENT } from '@src/project/constants'
import type { CdktfProjectOptions } from '@cdktf/cli-core/src/lib/cdktf-project'
import type { ProjectConfiguration } from '@src/project/types'

export * from './project'
export * from './types'

type GetProjectOpts = Partial<Pick<CdktfProjectOptions, 'workingDirectory' | 'onUpdate' | 'onLog'>>

export const getProject = (
  configuration: ProjectConfiguration,
  environment: string = ENVIRONMENT.PRODUCTION,
  { workingDirectory, onUpdate, onLog }: GetProjectOpts = {},
): Project => {
  const services = getProjectServices(configuration, environment)
  const operation = new Operation(services, environment, workingDirectory || process.cwd())

  return new Project(operation.process(), {
    onUpdate: onUpdate || (() => {}),
    onLog: onLog || (() => {}),
  })
}
