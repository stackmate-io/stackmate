import { readJsonFile, readYamlFile } from '@src/lib/file'
import { getProjectServices } from '@src/project/utils/getProjectServices'
import { Operation } from '@src/operation'
import type { Project } from '@src/project/types'

export const getProjectStack = (file: string, environment: string): object => {
  const contents = (
    file.endsWith('.yml') || file.endsWith('.yaml') ? readYamlFile(file) : readJsonFile(file)
  ) as Project

  const services = getProjectServices(contents, environment)

  const operation = new Operation(services, environment, process.env)
  return operation.process()
}
