import { MultiNode, Profilable, Sizeable, Storable, Versioned } from './util';

export interface BaseService extends Profilable {
  name: string;
  links: string[];
}

export interface DatabaseService extends BaseService, Sizeable, Storable, MultiNode, Versioned {
  engine: string;
  database: string;
  port: number;
}
