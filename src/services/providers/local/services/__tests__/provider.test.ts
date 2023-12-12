import { provider as terraformLocalProvider } from '@cdktf/provider-local'
import { PROVIDER, SERVICE_TYPE } from '@src/constants'
import { LocalProvider } from '@src/services/providers/local/services/provider'
import { getSynthesizedStack } from '@tests/helpers/getSynthesizedStack'
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
    const config: LocalProviderAttributes = {
      name: 'local-provider',
      provider: 'local',
      type: 'provider',
    }

    it('registers the local provider', () => {
      const stack = getSynthesizedStack([config])
      expect(stack).toHaveProvider(terraformLocalProvider.LocalProvider)
    })
  })
})
