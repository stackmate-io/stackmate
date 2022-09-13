import { Address4 } from 'ip-address';

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
  ip: string, bitmask: number = 16, subnets: number = 2, subnetBitmask: number = 24,
): Array<string> => {
  const cidrBlocks: Array<string> = [];
  const root = new Address4(`${ip}/${bitmask}`);
  cidrBlocks.push(
    `${root.startAddress().address}/${bitmask}`,
  );

  const [firstOctet, secondOctet] = root.toArray();
  Array.from(Array(subnets).keys()).map((num) => {
    const subnetIp = [firstOctet, secondOctet, String(num + 1), String(0)].join('.')
    cidrBlocks.push(`${subnetIp}/${subnetBitmask}`);
  });

  return cidrBlocks;
};
