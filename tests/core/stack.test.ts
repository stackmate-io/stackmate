import { kebabCase } from 'lodash'
import { faker } from '@faker-js/faker'
import { Stack } from '@lib/stack'
import { TerraformStack, App as TerraformApp } from 'cdktf'

describe('Stack', () => {
  const stackName = kebabCase(faker.word.words({ count: 3 }))

  it('instantiates properly', () => {
    const stack = new Stack(stackName)
    expect(stack.app).toBeInstanceOf(TerraformApp)
    expect(stack.context).toBeInstanceOf(TerraformStack)
  })

  it('converts the name to something safe', () => {
    const name = 'This is a # test'
    const stack = new Stack(name)
    expect(stack.name).toEqual('this-is-a-test')
  })

  it('exports the stack as a terraform object', () => {
    const stack = new Stack(stackName)
    const output = stack.toObject()
    expect(output).toMatchObject({
      '//': {
        metadata: { stackName },
        outputs: {},
      },
    })
  })
})
