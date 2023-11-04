import { LocalBackend } from 'cdktf'
import { LocalState } from '@src/services/providers/local/services/state'
import { PROVIDER, SERVICE_TYPE } from '@src/constants'
import { getProvisionable } from '@core/provision'
import { Stack } from '@lib/stack'
import type { LocalStateAttributes } from '@src/services/providers/local/services/state'

describe('Local state', () => {
  const service = LocalState

  it('is a valid local state service', () => {
    expect(service.provider).toEqual(PROVIDER.LOCAL)
    expect(service.type).toEqual(SERVICE_TYPE.STATE)
  })

  it('provides the right schema', () => {
    expect(service.schema).toMatchObject({
      $id: 'services/local/state',
      type: 'object',
      required: ['name', 'type', 'provider'],
      additionalProperties: false,
      properties: {
        provider: {
          type: 'string',
          enum: [PROVIDER.LOCAL],
          default: PROVIDER.LOCAL,
        },
        type: {
          type: 'string',
          enum: [SERVICE_TYPE.STATE],
        },
        region: {
          type: 'string',
        },
      },
    })
  })

  describe('provision handler', () => {
    const stack = new Stack('stack-name')
    const config: LocalStateAttributes = {
      name: 'local-state',
      provider: 'local',
      type: 'state',
    }

    const provisionable = getProvisionable(config)

    it('registers the local state backend', () => {
      const resources = service.handler(provisionable, stack)
      expect(resources).toBeInstanceOf(Object)
      expect(Object.keys(resources)).toEqual(['backend'])
      expect(resources.backend).toBeInstanceOf(LocalBackend)
    })
  })
})
