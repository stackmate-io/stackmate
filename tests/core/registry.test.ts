import { Services } from '@core/registry'
import { REGIONS as AWS_REGIONS } from '@providers/aws/constants'
import { CLOUD_PROVIDER, PROVIDER, SERVICE_TYPE } from '@constants'

describe('Registry', () => {
  describe('all', () => {
    it('already has all the items loaded', () => {
      expect(Services.all()).toBeInstanceOf(Array)
      expect(Services.all().length).toBeGreaterThan(0)
    })
  })

  describe('ofType', () => {
    it('returns all services of a given type', () => {
      const services = Services.ofType(SERVICE_TYPE.MARIADB)
      expect(services).toBeInstanceOf(Array)
      expect(services.length).toBeGreaterThan(0)
      expect(new Set(services.map((s) => s.type))).toEqual(new Set([SERVICE_TYPE.MARIADB]))
    })
  })

  describe('ofProvider', () => {
    it('returns all services of a given provider', () => {
      const services = Services.ofProvider(PROVIDER.AWS)
      expect(services).toBeInstanceOf(Array)
      expect(services.length).toBeGreaterThan(0)
      expect(new Set(services.map((s) => s.provider))).toEqual(new Set([PROVIDER.AWS]))
    })
  })

  describe('get', () => {
    it('returns a service based on its provider and type', () => {
      const service = Services.get(PROVIDER.AWS, SERVICE_TYPE.MARIADB)
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

      const service = Services.fromConfig(config)
      expect(service).toBeInstanceOf(Object)
      expect(service.provider).toEqual(PROVIDER.AWS)
      expect(service.type).toEqual(SERVICE_TYPE.MARIADB)
    })
  })

  describe('providers', () => {
    it('returns all providers available with no service provided', () => {
      expect(Services.providers()).toEqual(
        expect.arrayContaining(Array.from(Object.values(CLOUD_PROVIDER))),
      )
    })

    it('returns all providers for a given service', () => {
      expect(Services.providers(SERVICE_TYPE.MARIADB)).toEqual(
        expect.arrayContaining(Array.from(Object.values(CLOUD_PROVIDER))),
      )
    })
  })

  describe('regions', () => {
    it('returns all regions available', () => {
      expect(Services.regions(PROVIDER.AWS)).toEqual(expect.arrayContaining(AWS_REGIONS))
      expect(Services.regions(PROVIDER.LOCAL)).toEqual([])
    })
  })

  describe('types', () => {
    it('returns all the service types available when no provider specified', () => {
      expect(Services.types()).toEqual(
        expect.arrayContaining([
          SERVICE_TYPE.MYSQL,
          SERVICE_TYPE.POSTGRESQL,
          SERVICE_TYPE.MARIADB,
          SERVICE_TYPE.STATE,
        ]),
      )
    })

    it('returns only the service types that are register with the provider specified', () => {
      expect(Services.types(PROVIDER.AWS)).toEqual(
        expect.arrayContaining([
          SERVICE_TYPE.MYSQL,
          SERVICE_TYPE.POSTGRESQL,
          SERVICE_TYPE.MARIADB,
          SERVICE_TYPE.STATE,
        ]),
      )

      expect(Services.types(PROVIDER.LOCAL)).toEqual(expect.arrayContaining([SERVICE_TYPE.STATE]))
    })
  })
})
