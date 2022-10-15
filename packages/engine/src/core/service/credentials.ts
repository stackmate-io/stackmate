import { TerraformLocal } from 'cdktf';

import { Stack } from '@stackmate/engine/core/stack';
import { SERVICE_TYPE } from '@stackmate/engine/constants';
import {
  associate, BaseService, BaseServiceAttributes, Provisionable, Service, ServiceRequirement,
} from '@stackmate/engine/core/service';

export type Credentials = {
  username: TerraformLocal;
  password: TerraformLocal;
};

export type CredentialsRequirement = ServiceRequirement<'credentials', 'deployable', Credentials, typeof SERVICE_TYPE.SECRETS>;
export type RootCredentialsRequirement = ServiceRequirement<'rootCredentials', 'deployable', Credentials, typeof SERVICE_TYPE.SECRETS>;
export type CredentialsHandlerOptions = {
  root?: boolean;
  length?: number;
  special?: boolean;
  exclude?: string[];
};

export type CredentialsHandler = (
  vault: Provisionable, target: Provisionable, stack: Stack, opts?: CredentialsHandlerOptions,
) => Credentials;

export type SecretsVaultService<Srv extends BaseService> = Srv & {
  credentials: CredentialsHandler,
};

export type VaultProvisionable = Provisionable & {
  service: SecretsVaultService<Provisionable['service']>;
};

export const withCredentials = <C extends BaseServiceAttributes>() => <T extends Service<C>>(srv: T): T & { associations: [CredentialsRequirement] } => (
  associate<C, [CredentialsRequirement]>([{
    as: 'credentials',
    from: SERVICE_TYPE.SECRETS,
    scope: 'deployable',
    requirement: true,
    handler: (vault: VaultProvisionable, target: Provisionable, stack: Stack): Credentials => (
      vault.service.credentials(vault, target, stack)
    ),
  }])(srv)
);

export const withRootCredentials = <C extends BaseServiceAttributes>() => <T extends Service<C>>(srv: T): T & { associations: [RootCredentialsRequirement] } => (
  associate<C, [RootCredentialsRequirement]>([{
    as: 'rootCredentials',
    from: SERVICE_TYPE.SECRETS,
    scope: 'deployable',
    requirement: true,
    handler: (vault: VaultProvisionable, target: Provisionable, stack: Stack): Credentials => (
      vault.service.credentials(vault, target, stack, { root: true })
    ),
  }])(srv)
);

export const withCredentialsGenerator = <C extends BaseServiceAttributes>(
  credentials: CredentialsHandler
) => <T extends Service<C>>(srv: T): T & SecretsVaultService<T> => ({
  ...srv,
  credentials,
});
