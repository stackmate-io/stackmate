import { TerraformLocal } from 'cdktf';

import { Stack } from '@stackmate/engine/core/stack';
import { SERVICE_TYPE } from '@stackmate/engine/constants';
import {
  associate, BaseService, BaseServiceAttributes, Provisionable, Service, ServiceRequirement, WithAssociations,
} from '@stackmate/engine/core/service';

/**
 * @type {Credentials} a credentials object returned by the credentials provision handler
 */
export type Credentials = {
  username: TerraformLocal;
  password: TerraformLocal;
};

/**
 * @type {CredentialsRequirement} adds a requirement for credentials
 */
export type CredentialsRequirement = ServiceRequirement<
  Credentials, typeof SERVICE_TYPE.SECRETS
>;

/**
 * @type {RootCredentialsRequirement} adds a requirement for root credentials
 */
export type RootCredentialsRequirement = ServiceRequirement<
  Credentials, typeof SERVICE_TYPE.SECRETS
>;

export type CredentialsAssociations = {
  deployable: {
    credentials: CredentialsRequirement;
  };
};

export type RootCredentialsAssociations = {
  deployable: {
    rootCredentials: RootCredentialsRequirement;
  };
};

/**
 * @type {CredentialsHandlerOptions} the options to pass into the credentials handler
 */
export type CredentialsHandlerOptions = {
  root?: boolean;
  length?: number;
  special?: boolean;
  exclude?: string[];
};

/**
 * @type {CredentialsHandler} the credentials association handler
 */
export type CredentialsHandler = (
  vault: Provisionable, target: Provisionable, stack: Stack, opts?: CredentialsHandlerOptions,
) => Credentials;

/**
 * @type {SecretsVaultService} describes secrets vault services
 */
export type SecretsVaultService<Srv extends BaseService> = Srv & {
  credentials: CredentialsHandler,
};

/**
 * @type {VaultProvisionable} a vault service provisionable
 */
export type VaultProvisionable = Provisionable & {
  service: SecretsVaultService<Provisionable['service']>;
};

/**
 * @returns {Function<Service>} the service enhanced with the crerentials association
 */
export const withCredentials = <C extends BaseServiceAttributes>(
) => <T extends Service<C>>(srv: T): WithAssociations<T, CredentialsAssociations> => (
  associate({
    deployable: {
      credentials: {
        from: SERVICE_TYPE.SECRETS,
        requirement: true,
        handler: (vault: VaultProvisionable, target: Provisionable, stack: Stack): Credentials => (
          vault.service.credentials(vault, target, stack)
        ),
      },
    },
  })(srv)
);

/**
 * @returns {Function<Service>} the service enhanced with the root crerentials association
 */
export const withRootCredentials = <C extends BaseServiceAttributes>(
) => <T extends Service<C>>(srv: T): WithAssociations<T, RootCredentialsAssociations> => (
  associate({
    deployable: {
      rootCredentials: {
        from: SERVICE_TYPE.SECRETS,
        requirement: true,
        handler: (vault: VaultProvisionable, target: Provisionable, stack: Stack): Credentials => (
          vault.service.credentials(vault, target, stack, { root: true })
        ),
      },
    },
  })(srv)
);

/**
 * This function is intended for secrets vault services.
 * It adds a `credentials` function which provides the credentials requested by other services
 *
 * @param {Function<Credentials>} onCredentialsRequested function that generates credentials
 * @returns {Service}
 */
export const withCredentialsGenerator = <C extends BaseServiceAttributes>(
  onCredentialsRequested: CredentialsHandler
) => <T extends Service<C>>(srv: T): T & SecretsVaultService<T> => ({
  ...srv,
  credentials: onCredentialsRequested,
});
