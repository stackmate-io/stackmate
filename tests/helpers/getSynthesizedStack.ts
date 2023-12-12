import os from 'node:os'
import { Operation } from '@src/operation'
import { ENVIRONMENT } from '@src/project/constants'
import { getProjectMock } from '@tests/mocks/project'
import { getProjectServices } from '@src/project/utils/getProjectServices'
import type { EnvironmentChoice } from '@src/project'
import type { ServiceConfiguration } from '@src/services/registry'

export const getSynthesizedStack = (
  configs: ServiceConfiguration[],
  environment: EnvironmentChoice = ENVIRONMENT.PRODUCTION,
) => {
  const project = getProjectMock(configs, environment)
  const services = getProjectServices(project, environment)

  const operation = new Operation(services, environment, os.tmpdir())
  const { content } = operation.process()

  return content
}
