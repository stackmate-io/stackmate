import { provider as terraformLocalProvider } from '@cdktf/provider-local'
import { PROVIDER, SERVICE_TYPE } from '@constants'
import { getProvisionable } from '@core/operation'
import { Stack } from '@core/stack'
import type {
  LocalProviderAttributes,
  LocalProviderProvisionable,
} from '@providers/local/services/provider'
import { LocalProvider, onPrepare } from '@providers/local/services/provider'

describe('Local Provider', () => {
  const service = LocalProvider

  it('is a valid local provider service', () => {
    expect(service.provider).toEqual(PROVIDER.LOCAL)
    expect(service.type).toEqual(SERVICE_TYPE.PROVIDER)
  })

  it('has the handlers registered only for the preparable scope', () => {
    expect(service.handlers.get('preparable')).toEqual(onPrepare)
    expect(service.handlers.get('deployable')).toBeUndefined()
    expect(service.handlers.get('destroyable')).toBeUndefined()
  })

  it('provides the right schema', () => {
    expect(service.schema).toMatchObject({
      $id: 'services/local/provider',
      type: 'object',
      required: [],
      additionalProperties: false,
      properties: {
        provider: {
          type: 'string',
          enum: [PROVIDER.LOCAL],
          default: PROVIDER.LOCAL,
        },
        type: {
          type: 'string',
          enum: [SERVICE_TYPE.PROVIDER],
          default: SERVICE_TYPE.PROVIDER,
        },
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
      const resources = onPrepare(provisionable as LocalProviderProvisionable, stack)
      expect(resources).toBeInstanceOf(Object)
      expect(Object.keys(resources)).toEqual(['provider'])
      expect(resources.provider).toBeInstanceOf(terraformLocalProvider.LocalProvider)
    })
  })
})
