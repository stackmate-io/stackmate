import { STORAGE } from '@stackmate/engine/constants';
import { ChoiceOf } from './util';

export type StorageChoice = ChoiceOf<typeof STORAGE>;

export interface StorageAdapter {
  deserialize(serialized: string | object): object;
  read(): Promise<object>;
}
