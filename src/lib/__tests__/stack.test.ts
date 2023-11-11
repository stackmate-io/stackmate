import { faker } from '@faker-js/faker/locale/af_ZA'
import { Stack } from '@src/lib/stack'
import { TerraformStack, App as TerraformApp } from 'cdktf'

describe('Stack', () => {
  let stackName: string
  let subject: Stack

  beforeEach(() => {
    stackName = faker.lorem.word()
    subject = new Stack(stackName)
  })

  it('has a name set', () => {
    expect(subject.name).toEqual(stackName)
  })

  it('has a terraform app', () => {
    expect(subject.app).toBeInstanceOf(TerraformApp)
  })

  it('has a terraform stack', () => {
    expect(subject.context).toBeInstanceOf(TerraformStack)
  })

  it('runs a handler in context', () => {
    let asserted = false

    const handler = (ctx: TerraformStack, app?: TerraformApp) => {
      asserted = ctx instanceof TerraformStack && app instanceof TerraformApp
    }

    subject.inContext(handler)

    expect(asserted).toBe(true)
  })

  it('exports the stack as a terraform object', () => {
    const output = subject.toObject()
    expect(output).toMatchObject({
      '//': {
        metadata: { stackName },
        outputs: {},
      },
    })
  })
})
