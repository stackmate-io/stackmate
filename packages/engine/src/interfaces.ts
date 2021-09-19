import { Construct } from 'constructs';
import { TerraformStack } from 'cdktf';

import {
  ProviderChoice, RegionList, ServiceAttributes, ServiceAssociation,
  ServiceMapping, ServiceTypeChoice, CloudPrerequisites, Validations, AttributeNames,
} from '@stackmate/types';

export interface CloudProvider {
  readonly provider: ProviderChoice;
  readonly regions: RegionList;
  readonly serviceMapping: ServiceMapping;
  init(): void;
  service(attributes: ServiceAttributes): CloudService;
}

export interface CloudService {
  readonly name: string;
  readonly provider: ProviderChoice;
  readonly type: ServiceTypeChoice;
  readonly associations: Array<ServiceAssociation>;
  links: Array<string>;
  attributes: ServiceAttributes;
  dependencies: CloudPrerequisites;
  link(target: CloudService): void;
  provision(): void;
}

export interface CloudStack extends TerraformStack {
  readonly name: string;
  readonly scope: Construct;
}

export interface Validatable {
  validate(attrs: object): void;
  validations(): Validations;
}

export interface AttributeAssignable {
  attributes: object;
  attributeNames(): AttributeNames;
}

export interface Sizeable extends Validatable, AttributeAssignable {
  size: string;
  validations(): Required<{ size: object }>;
  attributeNames(): Required<{ size: Function }>;
}

export interface Storable extends Validatable, AttributeAssignable {
  storage: number;
  validations(): Required<{ storage: object }>;
  attributeNames(): Required<{ storage: Function }>;
}

export interface Mountable extends Validatable, AttributeAssignable {
  volumes: string; // TODO
  valdations(): Required<{ volumes: object }>;
  attributeNames(): Required<{ volumes: Function }>;
}

export interface MultiNode extends Validatable, AttributeAssignable {
  nodes: number;
  valdations(): Required<{ nodes: object }>;
  attributeNames(): Required<{ nodes: Function }>;
}

export interface Authenticatable extends Validatable, AttributeAssignable {
  credentials: number; // TODO
  validations(): Required<{ credentials: object }>;
  attributeNames(): Required<{ credentials: Function }>;
}

export interface Rootable extends Validatable, AttributeAssignable {
  root: number; // TOOD
  validations(): Required<{ root: object }>;
  attributeNames(): Required<{ root: Function }>;
}
