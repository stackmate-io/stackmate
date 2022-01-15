import FileStorage from '@stackmate/storage/file';
import AwsParametersStorage from '@stackmate/storage/aws-params';
import { StorageChoice } from '@stackmate/types';
import { STORAGE } from '@stackmate/constants';
import { StorageAdapter } from '@stackmate/interfaces';

const getStoragAdaptereByType = (type: StorageChoice, attributes: object): StorageAdapter => {
  let adapter;

  if (type === STORAGE.AWS) {
    adapter = new AwsParametersStorage();
  }

  if (type === STORAGE.FILE) {
    adapter = new FileStorage();
  }

  if (!adapter) {
    throw new Error(
      `Invalid storage type ${type} provided. Available options are ${Object.values(STORAGE).join(', ')}`,
    );
  }

  adapter.attributes = attributes;
  adapter.validate()

  return adapter;
};

export {
  getStoragAdaptereByType,
  AwsParametersStorage,
  FileStorage,
};
