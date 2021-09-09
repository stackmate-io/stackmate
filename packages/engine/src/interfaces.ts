import { Construct } from 'constructs';

import {
  ProviderChoice, RegionList, ServiceAttributes, ServiceAssociation,
  ServiceMapping, ServiceTypeChoice, ServiceAssociationDeclarations,
  CloudPrerequisites, ServiceList,
} from 'types';

export interface CloudManager {
  readonly provider: ProviderChoice;
  readonly regions: RegionList;
  readonly serviceMapping: ServiceMapping;
  init(): void;
  prepare(): void;
  register(type: ServiceTypeChoice, attrs: ServiceAttributes): CloudService;
}

export interface CloudService {
  readonly name: string;
  readonly provider: ProviderChoice;
  readonly type: ServiceTypeChoice;
  readonly associations: Array<ServiceAssociation>;
  readonly regions: RegionList;
  links: ServiceAssociationDeclarations;
  set attributes(attributes: ServiceAttributes);
  set dependencies(dependencies: CloudPrerequisites);
  validate(): void;
  provision(): void;
  link(associations: ServiceList): void;
}

export interface CloudStack extends Construct {
  readonly name: string;
  readonly scope: Construct;
  readonly defaults: object;
}

export interface Sizeable {
  size: string;
  sizes: Array<string>;
  validations: Required<{ size: number }>;
}

export interface Storable {
  storage: number;
  validations: Required<{ storage: number }>;
}

export interface Mountable {
  volumes: string; // TODO
  valdations: Required<{ storage: number }>;
}

export interface MultiNode {
  nodes: number; // TODO
  valdations: Required<{ nodes: number }>;
}
