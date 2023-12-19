import os from 'node:os'
import { LocalState } from '@src/services/providers/local/services/state'
import { PROVIDER, SERVICE_TYPE } from '@src/constants'
import { kebabCase } from 'lodash'
import { faker } from '@faker-js/faker'
import { Operation } from '@src/operation'
import { ENVIRONMENT } from '@src/project/constants'
import type { LocalStateAttributes } from '@local/services/state'

describe('Local state', () => {
  const service = LocalState

  it('is a valid local state service', () => {
    expect(service.provider).toEqual(PROVIDER.LOCAL)
    expect(service.type).toEqual(SERVICE_TYPE.STATE)
  })

  it('provides the right schema', () => {
    expect(service.schema).toMatchObject({
      $id: 'services-local-state',
      type: 'object',
      required: expect.arrayContaining(['name', 'type', 'provider']),
      additionalProperties: false,
      properties: {
        provider: expect.objectContaining({ const: PROVIDER.LOCAL }),
        type: expect.objectContaining({ const: SERVICE_TYPE.STATE }),
      },
    })
  })

  describe('provision handler', () => {
    let config: LocalStateAttributes

    beforeEach(() => {
      config = {
        provider: PROVIDER.LOCAL,
        type: SERVICE_TYPE.STATE,
        name: kebabCase(faker.lorem.words()),
        directory: faker.system.directoryPath(),
        fileName: 'stackmate.tfstate',
      }
    })

    it('registers the local state backend', () => {
      const operation = new Operation([config], ENVIRONMENT.PRODUCTION, os.tmpdir())
      const { content: stack } = operation.process()

      const parsed = JSON.parse(stack)
      expect(parsed.terraform.backend.local).toMatchObject({
        path: config.fileName,
        workspace_dir: config.directory,
      })
    })
  })
})
