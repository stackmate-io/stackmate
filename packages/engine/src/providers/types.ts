import {
  BaseServiceAttributes, ConnectableAttributes, ExternallyLinkableAttributes,
  LinkableAttributes, MultiNodeAttributes, ProfilableAttributes, SizeableAttributes,
  StorableAttributes, VersioningAttributes,
} from '@stackmate/engine/core/service';

export type DatabaseServiceAttributes = BaseServiceAttributes
  & SizeableAttributes
  & VersioningAttributes
  & LinkableAttributes
  & ExternallyLinkableAttributes
  & MultiNodeAttributes
  & StorableAttributes
  & ConnectableAttributes
  & ProfilableAttributes
  & {
    database: string;
  };

export type MonitoringServiceAttributes = BaseServiceAttributes & {
  email: string;
};
