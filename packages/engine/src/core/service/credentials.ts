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

export type CredentialsAssociation = ServiceAssociation<'credentials', typeof SERVICE_TYPE.SECRETS, 'deployable', Credentials>;
export type RootCredentialsAssociation = ServiceAssociation<'rootCredentials', typeof SERVICE_TYPE.SECRETS, 'deployable', Credentials>;

export type CredentialsHandler = (
  provisionable: Provisionable, stack: Stack, opts?: { root?: boolean }
) => Credentials;

export type SecretsVaultService<Srv extends BaseService> = Srv & {
  credentials: CredentialsHandler,
};

export type VaultProvisionable = Provisionable & {
  service: SecretsVaultService<Provisionable['service']>;
};

export const withCredentials = <C extends BaseServiceAttributes>() => <T extends Service<C>>(srv: T): T & { associations: [CredentialsAssociation] } => (
  associate<C, [CredentialsAssociation]>([{
    as: 'credentials',
    from: SERVICE_TYPE.SECRETS,
    scope: 'deployable',
    handler: (vault: VaultProvisionable, stack: Stack): Credentials => (
      vault.service.credentials(vault, stack)
    ),
  }])(srv)
);

export const withRootCredentials = <C extends BaseServiceAttributes>() => <T extends Service<C>>(srv: T): T & { associations: [RootCredentialsAssociation] } => (
  associate<C, [RootCredentialsAssociation]>([{
    as: 'rootCredentials',
    from: SERVICE_TYPE.SECRETS,
    scope: 'deployable',
    handler: (vault: VaultProvisionable, stack: Stack): Credentials => (
      vault.service.credentials(vault, stack, { root: true })
    ),
  }])(srv)
);

export const withCredentialsGenerator = <C extends BaseServiceAttributes>(
  credentials: CredentialsHandler
) => <T extends Service<C>>(srv: T): T & SecretsVaultService<T> => ({
  ...srv,
  credentials,
});
