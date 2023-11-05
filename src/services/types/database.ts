import type {
  SizeableAttributes,
  VersioningAttributes,
  LinkableAttributes,
  ExternallyLinkableAttributes,
  MultiNodeAttributes,
  StorableAttributes,
  ConnectableAttributes,
  ProfilableAttributes,
} from '@services/behaviors'
import type { BaseServiceAttributes } from './util'

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
