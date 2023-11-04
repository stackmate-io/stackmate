import { faker } from '@faker-js/faker'
import { hashObject, hashString, uniqueIdentifier } from '@lib/hash'
import { Obj } from '@lib/util'

describe('hashString', () => {
  const txt = faker.lorem.sentence()

  it('hashes a string', () => {
    const hash = hashString(txt)
    expect(typeof hash).toEqual('string')
  })

  it('returns the exact same string', () => {
    const hash1 = hashString(txt)
    const hash2 = hashString(txt)

    expect(hash1).toStrictEqual(hash2)
  })
})

describe('hashObject', () => {
  const obj = {
    a: faker.number.int(),
    b: faker.lorem.word(),
    c: faker.datatype.boolean(),
  }

  it('hashes an object', () => {
    const hash = hashObject(obj)

    expect(typeof hash).toEqual('string')
  })

  it('returns the exact same string', () => {
    const hash1 = hashObject(obj)
    const hash2 = hashObject(obj)

    expect(hash1).toStrictEqual(hash2)
  })
})

describe('uniqueIdentifier', () => {
  const prefix = faker.lorem.word()
  let hashable: Obj

  beforeEach(() => {
    hashable = {
      a: faker.number.int(),
      b: faker.lorem.word(),
      c: faker.datatype.boolean(),
    }
  })

  it('provides a unique identifier when hashing the same content', () => {
    const id1 = uniqueIdentifier(prefix, hashable, {  separator: '-'})
    const id2 = uniqueIdentifier(prefix, hashable, { separator: '-' })
    expect(id1).not.toEqual(id2)
  })
})
