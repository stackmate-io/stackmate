import { getDomainMatcher, getDomainsOrder, getTopLevelDomain } from '@lib/domain'

describe('getDomainMatcher', () => {
  const regExp = getDomainMatcher()

  it('matches valid domain names', () => {
    expect(regExp.test('something.com')).toBe(true)
    expect(regExp.test('test.something.com')).toBe(true)
    expect(regExp.test('abc-test.s0meth1ng.com')).toBe(true)
    expect(regExp.test('level2.abc-test.s0meth1ng.com')).toBe(true)
    expect(regExp.test('multi-level.level2.abc-test.s0meth1ng.com')).toBe(true)
  })

  it('does not match invalid domain names', () => {
    expect(regExp.test('')).toBe(false)
    expect(regExp.test('abc')).toBe(false)
    expect(regExp.test('1234')).toBe(false)
    expect(regExp.test('[object]')).toBe(false)
    expect(regExp.test('hello().world.com')).toBe(false)
  })
})

describe('getTopLevelDomain', () => {
  it('returns the tlds for valid domain names', () => {
    expect(getTopLevelDomain('something.com')).toEqual('something.com')
    expect(getTopLevelDomain('test.something.com')).toEqual('something.com')
    expect(getTopLevelDomain('abc-12345.something.com')).toEqual('something.com')
  })

  it('raises errors for invalid domain names', () => {
    expect(() => getTopLevelDomain('wrong!')).toThrow()
    expect(() => getTopLevelDomain('123456')).toThrow()
    expect(() => getTopLevelDomain('')).toThrow()
  })
})

describe('getDomainsOrder', () => {
  it('throws errors for invalid domains list', () => {
    expect(() => getDomainsOrder([])).toThrow()
    expect(() => getDomainsOrder(['abc', '12345'])).toThrow()
  })

  it('throws errors when more than 1 TLDs are found', () => {
    expect(() => getDomainsOrder(['domain1.com', 'domain2.com'])).toThrow()
    expect(() => getDomainsOrder(['this.com', 'that.com'])).toThrow()
  })

  it('returns the primary and secondary domain names', () => {
    expect(getDomainsOrder(['something.com', 'test.something.com', 'dev.something.com'])).toEqual(
      expect.objectContaining({
        primary: 'something.com',
        secondary: ['test.something.com', 'dev.something.com'],
      }),
    )

    expect(
      getDomainsOrder(['app.something.com', 'test.something.com', 'dev.something.com']),
    ).toEqual(
      expect.objectContaining({
        primary: 'something.com',
        secondary: ['app.something.com', 'test.something.com', 'dev.something.com'],
      }),
    )
  })
})
