import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group'
import { hashString } from '@lib/hash'
import { getIpAddressParts, getCidrBlocks } from '@lib/networking'
import type { Stack } from '@lib/stack'
import type { ExternallyLinkableAttributes, ConnectableAttributes } from '@services/behaviors'
import type { Provisionable, BaseServiceAttributes, Provisions } from '@services/types'
import type { AwsService } from '@aws/types'

type ExternallyLinkableServiceProvisionable = Provisionable<
  AwsService<BaseServiceAttributes & ExternallyLinkableAttributes & ConnectableAttributes>,
  Provisions
>

export const onExternalLink = (
  provisionable: ExternallyLinkableServiceProvisionable,
  stack: Stack,
) => {
  const {
    config: { externalLinks = [], port },
    requirements: { vpc },
  } = provisionable

  const securityGroups = externalLinks.map((ipAddress) => {
    const { ip, mask } = getIpAddressParts(ipAddress)
    const sgName: string = `allow-external-ip-${hashString(ipAddress)}`

    return new SecurityGroup(stack.context, sgName, {
      vpcId: vpc.id,
      name: sgName,
      ingress: [
        {
          fromPort: port,
          toPort: port,
          description: `Allow connections from ${ipAddress}`,
          cidrBlocks: getCidrBlocks(ip, mask),
        },
      ],
    })
  })

  return securityGroups
}
