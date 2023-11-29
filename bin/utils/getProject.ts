import { Operation } from '@src/operation'
import { Project } from '@src/project'
import { ENVIRONMENT } from '@src/project/constants'
import { getProjectServices } from '@src/project/utils/getProjectServices'
import type { ProjectConfiguration } from '@src/project'
import type { CdktfProjectOptions } from '@cdktf/cli-core/src/lib/cdktf-project'

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
