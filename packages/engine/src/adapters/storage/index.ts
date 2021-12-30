import { StorageChoice, StorageOptions } from '@stackmate/types';
import { StorageAdapter } from '@stackmate/interfaces';
import { STORAGE } from '@stackmate/constants';
import LocalFileAdapter from './local';
import AwsParameterStore from './aws/parameter-store';

const getStorageAdapter = (storage: StorageChoice, storageOptions: StorageOptions): StorageAdapter => {
  let adapter: StorageAdapter | undefined;

  switch (storage) {
    case STORAGE.FILE:
      adapter = new LocalFileAdapter();
      break;
    case STORAGE.AWS_PARAMS:
      adapter = new AwsParameterStore();
      break;
    default:
      throw new Error(`Invalid storage “${storage}” specified`);
  }

  adapter.attributes = storageOptions;
  adapter.validate();

  return adapter;
};

export {
  LocalFileAdapter,
  AwsParameterStore,
  getStorageAdapter,
};
