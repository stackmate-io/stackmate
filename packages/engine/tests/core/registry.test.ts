import { Registry } from '@stackmate/engine/core/registry';
import { REGIONS } from '@stackmate/engine/providers/aws/constants';
import { CLOUD_PROVIDER, PROVIDER, SERVICE_TYPE } from '@stackmate/engine';

describe('Registry', () => {
  it('already has items loaded', () => {
    expect(Registry.items).toBeInstanceOf(Array);
    expect(Registry.items.length).toBeGreaterThan(0);
  });

  it('returns all regions available', () => {
    expect(Registry.regions).toBeInstanceOf(Map);
    expect(Registry.regions.get('aws')).toBeInstanceOf(Set);
    expect(Registry.regions.get('aws')?.size).toBeGreaterThan(0);
    expect(Registry.regions.get('aws')!).toEqual(new Set(REGIONS));
  });

  describe('providers', () => {
    it('returns all providers available with no service provided', () => {
      expect(Registry.providers()).toEqual(
        expect.arrayContaining(Array.from(Object.values(CLOUD_PROVIDER)))
      );
    });

    it('returns all providers for a given service', () => {
      expect(Registry.providers(SERVICE_TYPE.MARIADB)).toEqual(
        expect.arrayContaining(Array.from(Object.values(CLOUD_PROVIDER)))
      );
    });
  });

  describe('ofType', () => {
    it('returns all services of a given type', () => {
      const services = Registry.ofType(SERVICE_TYPE.MARIADB);
      expect(services).toBeInstanceOf(Array);
      expect(services.length).toBeGreaterThan(0);
      expect(new Set(services.map(s => s.type))).toEqual(new Set([SERVICE_TYPE.MARIADB]));
    });
  });

  describe('ofProvider', () => {
    it('returns all services of a given provider', () => {
      const services = Registry.ofProvider(PROVIDER.AWS);
      expect(services).toBeInstanceOf(Array);
      expect(services.length).toBeGreaterThan(0);
      expect(new Set(services.map(s => s.provider))).toEqual(new Set([PROVIDER.AWS]));
    });
  });

  describe('get', () => {
    it('returns a service based on its provider and type', () => {
      const service = Registry.get(PROVIDER.AWS, SERVICE_TYPE.MARIADB);
      expect(service).toBeInstanceOf(Object);
      expect(service.provider).toEqual(PROVIDER.AWS);
      expect(service.type).toEqual(SERVICE_TYPE.MARIADB);
    });
  });

  describe('fromConfig', () => {
    it('returns a service based on its configuration object', () => {
      const config = {
        provider: PROVIDER.AWS,
        type: SERVICE_TYPE.MARIADB,
        region: REGIONS[0],
      };

      const service = Registry.fromConfig(config);
      expect(service).toBeInstanceOf(Object);
      expect(service.provider).toEqual(PROVIDER.AWS);
      expect(service.type).toEqual(SERVICE_TYPE.MARIADB);
    });
  });
});
