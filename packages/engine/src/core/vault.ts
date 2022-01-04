import { get } from 'lodash';

import Configuration from '@stackmate/core/configuration';
import AwsParametersStorageAdapter from '@stackmate/storage/aws-params';
import FileStorageAdapter from '@stackmate/storage/file';
import { Attribute } from '@stackmate/lib/decorators';
import { parseObject } from '@stackmate/lib/parsers';
import { PROVIDER } from '@stackmate/constants';
import { StorageAdapter, Vault as VaultInterface } from '@stackmate/interfaces';
import { AttributeParsers, CredentialsObject, Validations } from '@stackmate/types';

class Vault extends Configuration implements VaultInterface {
  /**
   * @var {String} validationMessage the error message
   */
  readonly validationMessage: string = 'The vault contents are invalid';

  /**
   * @var {Object} params the params stored in the vault
   */
  @Attribute params: object;

  /**
   * @var {String} projectName the project name to use
   */
  projectName: string;

  /**
   * @var {String} stageName the stage name to use
   */
  stageName: string;

  /**
   * @var {Object} storageOptions the storage options to use
   */
  storageOptions: object;

  /**
   * @constructor
   * @param {Object} params the params stored in the vault
   * @param {String} stageName the stage name to use
   * @param {Object} storageOptions the storage options to use
   */
  constructor(projectName: string, stageName: string, storageOptions: object) {
    super();

    this.projectName = projectName;
    this.stageName = stageName;
    this.storageOptions = storageOptions;
  }

  /**
   * @returns {StorageAdapter} the storage adapter to use for the vault
   */
  public get storage(): StorageAdapter {
    if (get(this.storageOptions, 'provider') === PROVIDER.AWS) {
      return AwsParametersStorageAdapter.factory({
        namespace: `/${this.projectName}/${this.stageName}`,
        ...this.storageOptions,
      });
    }

    if (get(this.storageOptions, 'path')) {
      return FileStorageAdapter.factory(this.storageOptions);
    }

    throw new Error('Invalid storage provider for the project’s vault');
  }

  /**
   * @returns {AttributeParsers}
   */
  parsers(): AttributeParsers {
    return {
      params: parseObject,
    };
  }

  /**
   * @returns {Validations} the validation rules that apply
   */
  validations(): Validations {
    return {};
  }

  credentials(service: string): CredentialsObject {
    return {};
  }

  rootCredentials(service: string): CredentialsObject {
    return { username: 'abc123', password: 'abc' };
  }
}

export default Vault;
