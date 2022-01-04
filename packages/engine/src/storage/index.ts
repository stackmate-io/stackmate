import { StorageChoice, StorageOptions } from '@stackmate/types';
import { StorageAdapter } from '@stackmate/interfaces';
import { STORAGE } from '@stackmate/constants';
import FileAdapter from '@stackmate/storage/file';
import AwsParametersAdapter from '@stackmate/storage/aws-params';

const getStorageAdapter = (storage: StorageChoice, storageOptions: StorageOptions): StorageAdapter => {
  let adapter: StorageAdapter | undefined;

  switch (storage) {
    case STORAGE.FILE:
      adapter = new FileAdapter();
      break;
    case STORAGE.AWS_PARAMS:
      adapter = new AwsParametersAdapter();
      break;
    default:
      throw new Error(`Invalid storage “${storage}” specified`);
  }

  adapter.attributes = storageOptions;
  adapter.validate();

  return adapter;
};

export {
  FileAdapter,
  AwsParametersAdapter,
  getStorageAdapter,
};
