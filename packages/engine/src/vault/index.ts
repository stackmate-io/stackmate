import { STORAGE } from '@stackmate/constants';
import { VaultProviderChoice } from '@stackmate/types';
import Vault from '@stackmate/core/vault';
import AwsParamsVault from './aws-params';

/**
 * Gets a vault by providing its attributes
 *
 * @param {VaultProviderChoice} provider the provider to use for the vault
 * @param {Object} attributes the vault's attributes
 * @returns {Vault}
 */
const getVaultByProvider = async (provider: VaultProviderChoice, attributes: object): Promise<Vault> => {
  if (!provider) {
    throw new Error('No provider has been specified for the vault');
  }

  let vault;

  if (provider === STORAGE.AWS_PARAMS) {
    vault = new AwsParamsVault();
  }

  if (!vault) {
    throw new Error(
      `Invalid secrets provider ${provider}. Available options are ${Object.values(STORAGE).join(', ')}`,
    );
  }

  vault.attributes = attributes;
  vault.validate();

  await vault.load();
  return vault;
};

export {
  getVaultByProvider,
};
