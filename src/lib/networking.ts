import { uniq } from 'lodash'
import { Address4, Address6 } from 'ip-address'

/**
 * Returns a list of CIDR blocks based on a single IP
 *
 * @param {String} ip the IP address to base the CIDR blocks from
 * @param {Number} bitmask the bit mask to use
 * @param {Number} subnets the number of subnets to launch
 * @param {Number} subnetBitmask the bitmask to use for the subnets
 * @returns {Array<string>} the list of CIDR blocks
 */
export const getCidrBlocks = (
  ip: string,
  bitmask: number = 16,
  subnets: number = 2,
  subnetBitmask: number = 24,
): string[] => {
  const cidrBlocks: string[] = []
  const root = new Address4(`${ip}/${bitmask}`)
  const { address, addressMinusSuffix } = root.startAddress()

  cidrBlocks.push(`${addressMinusSuffix || address}/${bitmask}`)

  const [firstOctet, secondOctet] = root.toArray()
  Array.from(Array(subnets).keys()).map((num) => {
    const subnetIp = [firstOctet, secondOctet, String(num + 1), String(0)].join('.')
    cidrBlocks.push(`${subnetIp}/${subnetBitmask}`)
  })

  return uniq(cidrBlocks)
}

/**
 * @param {String} ipOrCidr the address to parse
 * @returns {Object} the IP / mask setup
 */
export const getIpAddressParts = (ipOrCidr: string): { ip: string; mask?: number } => {
  const addr = ipOrCidr.match(':') ? new Address6(ipOrCidr) : new Address4(ipOrCidr)
  const { addressMinusSuffix, address } = addr.startAddress()
  return { ip: addressMinusSuffix || address, mask: addr.subnetMask }
}

/**
 * Converts an IP Address to a CIDR block
 *
 * @param {String} ipOrCidr the IP or CIDR address to parse
 * @returns {String} the address as a CIDR block
 */
export const convertIpToCidr = (ipOrCidr: string): string => {
  const { ip, mask = 32 } = getIpAddressParts(ipOrCidr)
  return `${ip}/${mask}`
}

/**
 * @param {String} ip the value to check
 * @returns {Boolean} whether the given value is an IP address or not
 */
export const isAddressValid = (ip: string): boolean => {
  try {
    return (ip.match(':') ? new Address6(ip) : new Address4(ip)).isCorrect()
  } catch (err) {
    return false
  }
}
