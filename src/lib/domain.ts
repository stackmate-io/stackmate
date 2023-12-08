import { isEmpty, uniq } from 'lodash'

/**
 * @returns {String} the regular expression that matches domains
 */
export const getDomainMatcher = (): string =>
  '^(([a-zA-Z0-9]([-a-zA-Z0-9]{0,61}[a-zA-Z0-9])?.)+|)?([a-zA-Z0-9]{1,2}([-a-zA-Z0-9]{0,252}[a-zA-Z0-9])?).([a-zA-Z]{2,63})$'

/**
 * Extracts the TLD part from a domain string
 *
 * @param {String} domain the domain to get the TLD for
 * @returns {String} the tld
 */
export const getTopLevelDomain = (domain: string): string => {
  if (!domain.match(getDomainMatcher())) {
    throw new Error(`${domain} is not a valid domain name`)
  }

  const parts = domain.split('.')
  const tld = parts.slice(-2, parts.length).join('.')
  return domain.includes(tld) ? tld : domain
}

/**
 * Separate primary and secondary domains from a list of domains
 *
 * @param {String[]} domains the domains to order
 */
export const getDomainsOrder = (domains: string[]): { primary: string; secondary: string[] } => {
  const regExp = new RegExp(getDomainMatcher())
  const validDomains = domains.filter((domain) => regExp.test(domain))

  if (isEmpty(validDomains)) {
    throw new Error('The domains list does not contain any valid domains')
  }

  const [tld, ...others] = uniq(domains.map(getTopLevelDomain))

  if (!isEmpty(others)) {
    throw new Error('The list of domains contains more than 1 TLD')
  }

  const primaryIdx = domains.findIndex((domain) => domain === tld)
  let primary: string = tld

  if (primaryIdx >= 0) {
    ;[primary] = domains.splice(primaryIdx, 1)
  }

  return { primary, secondary: domains }
}
