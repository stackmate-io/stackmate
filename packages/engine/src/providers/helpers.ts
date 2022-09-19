import { OneOfType } from '@stackmate/engine/lib';
import { SERVICE_TYPE } from '@stackmate/engine/constants';
import { ServiceAssociation, ServiceScopeChoice } from '@stackmate/engine/core/service';
import { AwsProviderProvisionable } from '@stackmate/engine/providers/aws/services/provider';
import { AwsSecretsProvisionable } from '@stackmate/engine/providers/aws/services/secrets';

export type ProviderProvisionable<S extends ServiceScopeChoice> = OneOfType<[
  AwsProviderProvisionable<S>
]>;

export type SecretsVaultProvisionable<S extends ServiceScopeChoice> = OneOfType<[
  AwsSecretsProvisionable<S>
]>;

export type Credentials = {
  username: string;
  password: string;
};

export type CredentialsAssociations = [
  ServiceAssociation<'credentials', typeof SERVICE_TYPE.SECRETS, 'deployable', Credentials>,
  ServiceAssociation<'rootCredentials', typeof SERVICE_TYPE.SECRETS, 'deployable', Credentials>,
];

/**
 * @param {ServiceScopeChoice} scope the scope to get the associations for
 * @returns {CredentialsAssociations<ServiceScopeChoice>} the associations for ths scope specified
 */
export const getCredentialsAssociations = (): CredentialsAssociations=> ([{
    as: 'credentials',
    from: SERVICE_TYPE.SECRETS,
    scope: 'deployable',
    handler: (vault: ProviderProvisionable<'deployable'>): Credentials => {
      return { username: '', password: '' };
    },
  }, {
    as: 'rootCredentials',
    from: SERVICE_TYPE.SECRETS,
    scope: 'deployable',
    handler: (vault: ProviderProvisionable<'deployable'>): Credentials => {
      return { username: '', password: '' };
    },
  },
]);
