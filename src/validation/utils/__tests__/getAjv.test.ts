import { getAjv } from '@src/validation/utils/getAjv'
import type Ajv from 'ajv'
import type { FuncKeywordDefinition } from 'ajv/dist/types'

describe('getAjv', () => {
  let ajv: Ajv

  beforeAll(() => {
    ajv = getAjv()
  })

  it('returns an Ajv instance with serviceLinks keyword in place', () => {
    const serviceLinks = ajv.getKeyword('serviceLinks')
    expect(serviceLinks).not.toBe(false)
    expect((serviceLinks as FuncKeywordDefinition).compile).toBeInstanceOf(Function)
  })

  it('returns an Ajv instance with isIpOrCidr keyword in place', () => {
    const ipOrCidr = ajv.getKeyword('isIpOrCidr')
    expect(ipOrCidr).not.toBe(false)
    expect((ipOrCidr as FuncKeywordDefinition).compile).toBeInstanceOf(Function)
  })

  it('returns an Ajv instance with serviceProfile keyword in place', () => {
    const serviceProfile = ajv.getKeyword('serviceProfile')
    expect(serviceProfile).not.toBe(false)
    expect((serviceProfile as FuncKeywordDefinition).compile).toBeInstanceOf(Function)
  })

  it('returns an Ajv instance with serviceProfileOverrides keyword in place', () => {
    const overrides = ajv.getKeyword('serviceProfileOverrides')
    expect(overrides).not.toBe(false)
    expect((overrides as FuncKeywordDefinition).compile).toBeInstanceOf(Function)
  })
})
