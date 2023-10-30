import { getCidrBlocks, getIpAddressParts, convertIpToCidr, isAddressValid } from '@lib/networking';

describe('Networking functions', () => {
  describe('isAddressValid', () => {
    it('returns true for a valid IPv4 address', () => {
      expect(isAddressValid('192.168.1.1')).toBe(true);
    });

    it('returns true for a valid IPv6 address', () => {
      expect(isAddressValid('2001:db8:3333:4444:5555:6666:7777:8888')).toBe(true);
    });

    it('returns true for a valid CIDR block', () => {
      expect(isAddressValid('192.168.0.1/24')).toBe(true);
    });

    it('returns false for an invalid address', () => {
      expect(isAddressValid('256.256.256.256')).toBe(false);
      expect(isAddressValid('56FE::2159:5BBC::6594')).toBe(false);
      expect(isAddressValid('192.168.1.1/128')).toBe(false);
    });
  });

  describe('getIpAddressParts', () => {
    it('returns the parts for a valid IPv4 address', () => {
      expect(getIpAddressParts('192.168.1.1')).toEqual({
        ip: '192.168.1.1',
        mask: 32,
      });

      expect(getIpAddressParts('192.168.1.1/24')).toEqual({
        ip: '192.168.1.0',
        mask: 24,
      });
    });
  });

  describe('getCidrBlocks', () => {
    it('returns the CIDR blocks for an IP given a subnet mask', () => {
      expect(new Set(getCidrBlocks('192.168.1.0', 24))).toEqual(
        new Set(['192.168.1.0/24', '192.168.2.0/24']),
      );
    });
  });

  describe('convertIpToCidr', () => {
    it('returns the CIDR block for an IP that does not contain the mask', () => {
      expect(convertIpToCidr('192.168.1.1')).toEqual('192.168.1.1/32');
    });

    it('returns the CIDR block for an IP that contains a mask', () => {
      expect(convertIpToCidr('192.168.1.0/24')).toEqual('192.168.1.0/24');
    });
  });
});
