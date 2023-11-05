import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group'
import type { Stack } from '@lib/stack'
import type { LinkableAttributes, ConnectableAttributes } from '@services/behaviors'
import type {
  Provisionable,
  BaseServiceAttributes,
  Provisions,
  BaseProvisionable,
} from '@services/types'
import type { AwsService } from '@aws/types'

type LinkableServiceProvisionable = Provisionable<
  AwsService<BaseServiceAttributes & LinkableAttributes & ConnectableAttributes>,
  Provisions
>

export const onServiceLinked = (
  provisionable: LinkableServiceProvisionable,
  stack: Stack,
  linked: BaseProvisionable,
) => {
  const {
    config: { port, name: toName },
    requirements: { vpc },
  } = provisionable
  const {
    provisions = {},
    config: { name: fromName },
  } = linked
  const sgName = `allow-incoming-from-${fromName}-to-${toName}`
  const { ip } = provisions

  if (!ip) {
    throw new Error(`The IP resource on service ${fromName} is not provisioned yet`)
  }

  return new SecurityGroup(stack.context, sgName, {
    vpcId: vpc.id,
    name: sgName,
    ingress: [
      {
        fromPort: port,
        toPort: port,
        description: `Allow connections from ${fromName} to ${toName}`,
        cidrBlocks: [ip.expression()],
      },
    ],
  })
}
