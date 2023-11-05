import { DEFAULT_PROFILE_NAME, PROVIDER, SERVICE_TYPE } from '@src/constants'
import { Registry, type ServiceAttributes } from '@services/registry'
import { generateCredentials } from '@aws/services/secrets'
import { resourceHandler as providerDeployHandler } from '@aws/services/provider'
import { kebabCase, snakeCase } from 'lodash'
import { faker } from '@faker-js/faker'
import {
  RDS_DEFAULT_VERSIONS_PER_ENGINE,
  RDS_ENGINE_PER_SERVICE_TYPE,
  RDS_INSTANCE_SIZES,
} from '@src/services/providers/aws/constants'
import type { ServiceTypeChoice } from '@src/services/types'

import type { Stack } from '@lib/stack'
import type { BaseProvisionable } from 'src/services/types/provisionable'
import type { CredentialsHandlerOptions } from 'src/services/behaviors'
import type {
  AwsSecretsResources,
  AwsSecretsProvisionable,
} from '@src/services/providers/aws/services/secrets'
import type {
  AwsProviderProvisionable,
  AwsProviderResources,
} from '@src/services/providers/aws/types'

export const getProviderResources = (stack: Stack): AwsProviderResources => {
  const provisionable = Registry.provisionable({
    provider: PROVIDER.AWS,
    name: 'aws-provider-service',
    type: SERVICE_TYPE.PROVIDER,
    region: 'eu-central-1',
  })

  return providerDeployHandler(provisionable as AwsProviderProvisionable, stack)
}

export const getCredentialResources = (
  providerResources: AwsProviderResources,
  target: BaseProvisionable,
  stack: Stack,
  opts?: CredentialsHandlerOptions,
): AwsSecretsResources => {
  const provisionable = Registry.provisionable({
    provider: PROVIDER.AWS,
    name: 'aws-secrets-service',
    type: SERVICE_TYPE.SECRETS,
    region: 'eu-central-1',
  })

  Object.assign(provisionable, { requirements: providerResources })

  return generateCredentials(provisionable as AwsSecretsProvisionable, stack, target, opts)
}

export const getAwsProvisionable = <P extends BaseProvisionable>(
  config: ServiceAttributes,
  stack: Stack,
  { withCredentials = false, withRootCredentials = false } = {},
): P => {
  const provisionable = Registry.provisionable(config)
  const providerResources = getProviderResources(stack)

  Object.assign(provisionable, {
    requirements: {
      ...providerResources,
      ...(withCredentials
        ? { credentials: getCredentialResources(providerResources, provisionable, stack) }
        : {}),
      ...(withRootCredentials
        ? {
            rootCredentials: getCredentialResources(providerResources, provisionable, stack, {
              root: true,
            }),
          }
        : {}),
    },
  })

  return provisionable as P
}

export const getAwsDbMock = (
  type = faker.helpers.arrayElement([
    SERVICE_TYPE.MYSQL,
    SERVICE_TYPE.MARIADB,
    SERVICE_TYPE.POSTGRESQL,
  ]),
) => {
  const engine = RDS_ENGINE_PER_SERVICE_TYPE[type]
  return {
    name: kebabCase(faker.lorem.words()),
    provider: PROVIDER.AWS,
    type: type as ServiceTypeChoice,
    region: 'eu-central-1',
    size: faker.helpers.arrayElement(RDS_INSTANCE_SIZES),
    version: RDS_DEFAULT_VERSIONS_PER_ENGINE[engine],
    database: snakeCase(faker.lorem.word()),
    engine,
    links: [],
    externalLinks: [],
    nodes: 1,
    storage: faker.number.int({ min: 10, max: 100000 }),
    port: 5432,
    profile: DEFAULT_PROFILE_NAME,
    overrides: {},
    monitoring: {
      emails: [faker.internet.email()],
      urls: [faker.internet.url()],
    },
  }
}
