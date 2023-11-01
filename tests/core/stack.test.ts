import { TerraformStack, App as TerraformApp } from 'cdktf'

import { getStack } from '@core/stack'

describe('Stack', () => {
  const stackName = 'my-stage-name'

  it('instantiates properly', () => {
    const stack = getStack(stackName.toUpperCase())
    expect(stack.app).toBeInstanceOf(TerraformApp)
    expect(stack.context).toBeInstanceOf(TerraformStack)
    expect(stack.name).toEqual(stackName)
  })

  it('exports the stack as a terraform object', () => {
    const stack = getStack(stackName)
    const output = stack.toObject()
    expect(output).toMatchObject({
      '//': {
        metadata: { stackName },
        outputs: {},
      },
    })
  })
})
