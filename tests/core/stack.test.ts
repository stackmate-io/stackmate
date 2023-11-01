import { TerraformStack, App as TerraformApp } from 'cdktf'

import { getStack } from '@core/stack'

describe('Stack', () => {
  const projectName = 'my-project-name'
  const stageName = 'my-stage-name'

  it('instantiates properly', () => {
    const stack = getStack(projectName, stageName)
    expect(stack.app).toBeInstanceOf(TerraformApp)
    expect(stack.context).toBeInstanceOf(TerraformStack)

    expect(stack.projectName).toEqual(projectName)
    expect(stack.stageName).toEqual(stageName)
  })

  it('exports the stack as a terraform object', () => {
    const stack = getStack(projectName, stageName)
    const output = stack.toObject()
    expect(output).toMatchObject({
      '//': {
        metadata: { stackName: `${projectName}-${stageName}` },
        outputs: {},
      },
    })
  })
})
