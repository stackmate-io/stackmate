import { provider as terraformLocalProvider } from '@cdktf/provider-local'
import { PROVIDER, SERVICE_TYPE } from '@src/constants'
import { Stack } from '@lib/stack'
import { LocalProvider } from '@src/services/providers/local/services/provider'
import { getProvisionable } from '@tests/helpers/getProvisionable'
import type { LocalProviderAttributes } from '@local/types'

describe('Local Provider', () => {
  const service = LocalProvider

  it('is a valid local provider service', () => {
    expect(service.provider).toEqual(PROVIDER.LOCAL)
    expect(service.type).toEqual(SERVICE_TYPE.PROVIDER)
  })

  it('provides the right schema', () => {
    expect(service.schema).toMatchObject({
      $id: 'services/local/provider',
      type: 'object',
      required: expect.arrayContaining(['name', 'type', 'provider']),
      additionalProperties: false,
      properties: {
        provider: expect.objectContaining({ const: PROVIDER.LOCAL }),
        type: expect.objectContaining({ const: SERVICE_TYPE.PROVIDER }),
        region: {
          type: 'string',
        },
      },
    })
  })

  describe('onPrepare provision handler', () => {
    const stack = new Stack('stack-name')
    const config: LocalProviderAttributes = {
      name: 'local-provider',
      provider: 'local',
      type: 'provider',
    }

    const provisionable = getProvisionable(config)

    it('registers the local provider', () => {
      const resources = service.handler(provisionable, stack)
      expect(resources).toBeInstanceOf(Object)
      expect(Object.keys(resources)).toEqual(['provider'])
      expect(resources.provider).toBeInstanceOf(terraformLocalProvider.LocalProvider)
    })
  })
})
