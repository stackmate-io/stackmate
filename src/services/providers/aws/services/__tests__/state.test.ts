import os from 'node:os'
import { AwsState } from '@src/services/providers/aws/services/state'
import { REGIONS } from '@src/services/providers/aws/constants'
import { PROVIDER, SERVICE_TYPE } from '@src/constants'
import { Registry } from '@src/services/registry'
import { faker } from '@faker-js/faker'
import { Operation } from '@src/operation'
import { ENVIRONMENT } from '@src/project/constants'
import type { AwsStateAttributes } from '@src/services/providers/aws/services/state'

describe('AWS state', () => {
  const service = AwsState

  it('is a valid AWS secrets service', () => {
    expect(service.provider).toEqual(PROVIDER.AWS)
    expect(service.type).toEqual(SERVICE_TYPE.STATE)
  })

  it('has the AWS regions set', () => {
    expect(new Set(service.regions)).toEqual(new Set(REGIONS))
  })

  it('is fetched by the registry', () => {
    expect(Registry.get(PROVIDER.AWS, SERVICE_TYPE.STATE))
  })

  it('contains a valid schema', () => {
    expect(service.schema).toMatchObject({
      $id: 'services-aws-state',
      type: 'object',
      required: expect.arrayContaining(['provider', 'name', 'type', 'region', 'bucket']),
      additionalProperties: false,
      properties: {
        provider: expect.objectContaining({ const: PROVIDER.AWS }),
        type: expect.objectContaining({ const: SERVICE_TYPE.STATE }),
        region: expect.objectContaining({
          type: 'string',
          enum: Array.from(REGIONS),
        }),
        bucket: expect.objectContaining({
          type: 'string',
          minLength: 3,
          maxLength: 63,
        }),
      },
    })
  })

  describe('provision handlers', () => {
    let state: AwsStateAttributes

    beforeEach(() => {
      state = {
        name: 'aws-state-service',
        provider: PROVIDER.AWS,
        type: SERVICE_TYPE.STATE,
        region: 'eu-central-1',
        bucket: 'some-bucket-name',
        statePath: `${faker.system.directoryPath()}/state.tfstate`,
        lockTable: faker.internet.domainWord(),
      }
    })

    it('registers the backend', () => {
      const operation = new Operation([state], ENVIRONMENT.PRODUCTION, os.tmpdir())
      const { content: stack } = operation.process()

      const parsed = JSON.parse(stack)
      expect(parsed.terraform.backend.s3).toMatchObject({
        bucket: state.bucket,
        key: state.statePath,
        dynamodb_table: state.lockTable,
        region: state.region,
      })
    })
  })
})
