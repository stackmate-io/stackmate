import { Stack } from '@stackmate/engine/core/stack';
import { SERVICE_TYPE } from '@stackmate/engine/constants';
import {
  associate,
  BaseService, BaseServiceAttributes, Provisionable,
  Service, ServiceAssociation,
} from '@stackmate/engine/core/service';

export type Credentials = {
  username: string;
  password: string;
};

type CredentialsAssociation = ServiceAssociation<'credentials', typeof SERVICE_TYPE.SECRETS, 'deployable', Credentials>;
type RootCredentialsAssociation = ServiceAssociation<'rootCredentials', typeof SERVICE_TYPE.SECRETS, 'deployable', Credentials>;

export type WithCredentials<Srv extends BaseService> = Srv & {
  associations: [CredentialsAssociation];
};

export type WithRootCredentials<Srv extends BaseService> = Srv & {
  associations: [RootCredentialsAssociation];
};

export type CredentialsHandler = (
  config: BaseServiceAttributes, stack: Stack, opts?: { root?: boolean }
) => Credentials;

export type SecretsVaultService<Srv extends BaseService> = Srv & {
  credentials: CredentialsHandler,
};

export type VaultProvisionable = Provisionable & {
  service: SecretsVaultService<Provisionable['service']>;
};

export const withCredentials = <C extends BaseServiceAttributes>() => <T extends Service<C>>(srv: T) => (
  associate<C, [CredentialsAssociation]>([{
    as: 'credentials',
    from: SERVICE_TYPE.SECRETS,
    scope: 'deployable',
    handler: (vault: VaultProvisionable, stack: Stack): Credentials => (
      vault.service.credentials(vault.config, stack)
    ),
  }])(srv)
);

export const withRootCredentials = <C extends BaseServiceAttributes>() => <T extends Service<C>>(srv: T) => (
  associate<C, [RootCredentialsAssociation]>([{
    as: 'rootCredentials',
    from: SERVICE_TYPE.SECRETS,
    scope: 'deployable',
    handler: (vault: VaultProvisionable, stack: Stack): Credentials => (
      vault.service.credentials(vault.config, stack, { root: true })
    ),
  }])(srv)
);

export const withCredentialsGenerator = <C extends BaseServiceAttributes>(
  credentials: CredentialsHandler
) => <T extends Service<C>>(srv: T): T & {
  credentials: CredentialsHandler,
} => ({
  ...srv,
  credentials,
});
