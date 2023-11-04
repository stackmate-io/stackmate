import type { BaseServiceAttributes } from '@services/types'
import type {
  ConnectableAttributes,
  ExternallyLinkableAttributes,
  LinkableAttributes,
  MultiNodeAttributes,
  ProfilableAttributes,
  SizeableAttributes,
  StorableAttributes,
  VersioningAttributes,
} from '@core/service'

export type DatabaseServiceAttributes = BaseServiceAttributes &
  SizeableAttributes &
  VersioningAttributes &
  LinkableAttributes &
  ExternallyLinkableAttributes &
  MultiNodeAttributes &
  StorableAttributes &
  ConnectableAttributes &
  ProfilableAttributes & {
    database: string
  }
