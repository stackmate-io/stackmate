import { faker } from '@faker-js/faker/locale/af_ZA'
import { Stack } from '@src/lib/stack'
import { TerraformStack, App as TerraformApp } from 'cdktf'
import { isString } from 'lodash'

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

  it('exports the stack as a terraform object', () => {
    const output = subject.toSynthesized()

    expect(output).toMatchObject({
      name: stackName,
      dependencies: [],
      constructPath: expect.stringMatching(`/${stackName}$`),
      synthesizedStackPath: expect.stringMatching(`/${stackName}/main.tf.json$`),
      workingDirectory: expect.stringMatching(`/${stackName}$`),
    })

    expect(isString(output.content)).toBe(true)
    expect(JSON.parse(output.content)).toMatchObject({
      '//': {
        metadata: { stackName },
        outputs: {},
      },
    })
  })
})
