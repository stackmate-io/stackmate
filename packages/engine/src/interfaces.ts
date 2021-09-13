import { Construct } from 'constructs';

import {
  ProviderChoice, RegionList, ServiceAttributes, ServiceAssociation,
  ServiceMapping, ServiceTypeChoice, ServiceAssociationDeclarations,
  CloudPrerequisites, Validations, ServiceDeclaration,
} from '@stackmate/types';

export interface CloudManager {
  readonly provider: ProviderChoice;
  readonly regions: RegionList;
  readonly serviceMapping: ServiceMapping;
  init(): void;
  service(attributes: ServiceDeclaration): CloudService;
}

export interface CloudService {
  readonly name: string;
  readonly provider: ProviderChoice;
  readonly type: ServiceTypeChoice;
  readonly associations: Array<ServiceAssociation>;
  links: ServiceAssociationDeclarations;
  attributes: ServiceAttributes;
  dependencies: CloudPrerequisites;
  link(target: CloudService): void;
  provision(): void;
}

export interface CloudStack extends Construct {
  readonly name: string;
  readonly scope: Construct;
  readonly defaults: object;
}

export interface Validatable {
  validate(attrs: object): void;
  validations(): Validations;
}

export interface Sizeable extends Validatable {
  size: string;
  validations(): Required<{ size: object }>;
}

export interface Storable extends Validatable {
  storage: number;
  validations(): Required<{ storage: object }>;
}

export interface Mountable extends Validatable {
  volumes: string; // TODO
  valdations(): Required<{ volumes: object }>;
}

export interface MultiNode extends Validatable {
  nodes: number; // TODO
  valdations(): Required<{ nodes: object }>;
}

export interface Authenticatable extends Validatable {
  credentials: number; // TODO
  validations(): Required<{ credentials: object }>;
}

export interface Rootable extends Validatable {
  root: number; // TOOD
  validations(): Required<{ root: object }>;
}
