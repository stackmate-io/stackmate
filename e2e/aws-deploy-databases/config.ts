import type { ServiceConfiguration } from '@services/registry'

export const config: ServiceConfiguration[] = [
  {
    name: 'aws-provider',
    provider: 'aws',
    type: 'provider',
    region: 'eu-central-1',
  },
  {
    name: 'aws-secrets',
    provider: 'aws',
    type: 'secrets',
    region: 'eu-central-1',
  },
  {
    name: 'aws-state',
    type: 'state',
    provider: 'aws',
    region: 'eu-central-1',
    bucket: 'stackmate-state-bucket-0b231xvb',
  },
  {
    name: 'aws-db',
    provider: 'aws',
    region: 'eu-central-1',
    type: 'mysql',
  },
]
