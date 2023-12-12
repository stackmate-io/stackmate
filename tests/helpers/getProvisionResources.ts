import os from 'node:os'
import { Operation } from '@src/operation'
import { ENVIRONMENT } from '@src/project/constants'
import { getProjectMock } from '@tests/mocks/project'
import { getProjectServices } from '@src/project/utils/getProjectServices'
import type { ServiceConfiguration } from '@src/services/registry'

export const getSynthesizedStack = (config: ServiceConfiguration) => {
  const project = getProjectMock([config])
  const services = getProjectServices(project, ENVIRONMENT.PRODUCTION)

  const operation = new Operation(services, ENVIRONMENT.PRODUCTION, os.tmpdir())
  const { content } = operation.process()

  return content
}
