import { Registry } from '@services/registry'
import { REGIONS as AWS_REGIONS } from '@aws/constants'
import { PROVIDER, SERVICE_TYPE } from '@src/constants'

describe('Registry', () => {
  describe('all', () => {
    it('already has all the items loaded', () => {
      expect(Registry.all()).toBeInstanceOf(Array)
      expect(Registry.all().length).toBeGreaterThan(0)
    })
  })

  describe('get', () => {
    it('returns a service based on its provider and type', () => {
      const service = Registry.get(PROVIDER.AWS, SERVICE_TYPE.MARIADB)
      expect(service).toBeInstanceOf(Object)
      expect(service.provider).toEqual(PROVIDER.AWS)
      expect(service.type).toEqual(SERVICE_TYPE.MARIADB)
    })
  })

  describe('fromConfig', () => {
    it('returns a service based on its configuration object', () => {
      const config = {
        provider: PROVIDER.AWS,
        name: 'aws-mariadb-service',
        type: SERVICE_TYPE.MARIADB,
        region: AWS_REGIONS[0],
      }

      const service = Registry.fromConfig(config)
      expect(service).toBeInstanceOf(Object)
      expect(service.provider).toEqual(PROVIDER.AWS)
      expect(service.type).toEqual(SERVICE_TYPE.MARIADB)
    })
  })

  describe('providers', () => {
    it('returns all providers available with no service provided', () => {
      expect(Registry.providers()).toEqual(expect.arrayContaining([PROVIDER.AWS, PROVIDER.LOCAL]))
    })

    it('returns all providers for a given service', () => {
      expect(Registry.providers(SERVICE_TYPE.MARIADB)).toEqual(
        expect.arrayContaining([PROVIDER.AWS]),
      )
    })
  })

  describe('regions', () => {
    it('returns all regions available', () => {
      expect(Registry.regions(PROVIDER.AWS)).toEqual(expect.arrayContaining(AWS_REGIONS))
      expect(Registry.regions(PROVIDER.LOCAL)).toEqual([])
    })
  })

  describe('types', () => {
    it('returns all the service types available when no provider specified', () => {
      expect(Registry.types()).toEqual(
        expect.arrayContaining([
          SERVICE_TYPE.MYSQL,
          SERVICE_TYPE.POSTGRESQL,
          SERVICE_TYPE.MARIADB,
          SERVICE_TYPE.STATE,
        ]),
      )
    })

    it('returns only the service types that are register with the provider specified', () => {
      expect(Registry.types(PROVIDER.AWS)).toEqual(
        expect.arrayContaining([
          SERVICE_TYPE.MYSQL,
          SERVICE_TYPE.POSTGRESQL,
          SERVICE_TYPE.MARIADB,
          SERVICE_TYPE.STATE,
        ]),
      )

      expect(Registry.types(PROVIDER.LOCAL)).toEqual(expect.arrayContaining([SERVICE_TYPE.STATE]))
    })
  })
})
