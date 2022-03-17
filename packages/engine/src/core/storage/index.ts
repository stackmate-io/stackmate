import FileStorage from '@stackmate/engine/core/storage/file';
import { STORAGE } from '@stackmate/engine/constants';
import { StorageAdapter, StorageChoice } from '@stackmate/engine/types';

const getStoragAdaptereByType = (type: StorageChoice, attributes: object): StorageAdapter => {
  let adapter;

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
  FileStorage,
};
