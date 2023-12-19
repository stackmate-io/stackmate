import { PROVIDER, SERVICE_TYPE } from '@src/constants'
import { faker } from '@faker-js/faker'
import { alb, securityGroup } from '@cdktf/provider-aws'
import { Registry } from '@src/services/registry'
import { AwsLoadBalancer } from '@aws/services/loadbalancer'
import { getSynthesizedStack } from '@tests/helpers/getSynthesizedStack'
import type { AwsLoadBalancerAttributes } from '@aws/services/loadbalancer'

describe('AWS Load balancer', () => {
  const service = AwsLoadBalancer

  it('is a valid AWS load balancer service', () => {
    expect(service.provider).toEqual(PROVIDER.AWS)
    expect(service.type).toEqual(SERVICE_TYPE.LOAD_BALANCER)
  })

  it('is fetched by the registry', () => {
    expect(Registry.get(PROVIDER.AWS, SERVICE_TYPE.LOAD_BALANCER))
  })

  it('provides a valid schema', () => {
    expect(service.schema.$id).toEqual(`services-aws-${SERVICE_TYPE.LOAD_BALANCER}`)
    expect(service.schema.required).toEqual(expect.arrayContaining(['provider', 'name', 'type']))
  })

  it('registers the resources on deployment', () => {
    const config: AwsLoadBalancerAttributes = {
      name: faker.lorem.word(),
      provider: PROVIDER.AWS,
      type: SERVICE_TYPE.LOAD_BALANCER,
      region: 'eu-central-1',
    }

    const stack = getSynthesizedStack([config])

    expect(stack).toHaveResource(alb.Alb)
    expect(stack).toHaveResource(securityGroup.SecurityGroup)
  })
})
