import { Stack } from '@core/stack'
import { TerraformStack, App as TerraformApp } from 'cdktf'

describe('Stack', () => {
  const stackName = 'my-stage-name'

  it('instantiates properly', () => {
    const stack = new Stack(stackName.toUpperCase())
    expect(stack.app).toBeInstanceOf(TerraformApp)
    expect(stack.context).toBeInstanceOf(TerraformStack)
    expect(stack.name).toEqual(stackName)
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
