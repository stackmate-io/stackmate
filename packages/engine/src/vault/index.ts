import { STORAGE } from '@stackmate/constants';
import { VaultProviderChoice } from '@stackmate/types';
import Vault from '@stackmate/core/vault';
import AwsParamsVault from './aws-params';

const getVaultByProvider = async (provider: VaultProviderChoice, attributes: object): Promise<Vault> => {
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
