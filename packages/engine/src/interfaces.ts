import { Construct } from 'constructs';

import {
  ProviderChoice, RegionList, ServiceAttributes, ServiceAssociation,
  ServiceMapping, ServiceTypeChoice, ServiceAssociationDeclarations,
} from 'types';

export interface CloudManager {
  readonly provider: ProviderChoice;
  readonly regions: RegionList;
  readonly serviceMapping: ServiceMapping;
  init(): void;
  prepare(): void;
  register(type: ServiceTypeChoice, name: string, attrs: ServiceAttributes): CloudService;
}

export interface CloudService {
  readonly name: string;
  readonly provider: ProviderChoice;
  readonly type: ServiceTypeChoice;
  associations: ServiceAssociationDeclarations;
  validate(): void;
  requires(): Array<ServiceAssociation>;
  provision(): void;
  associate(associations: Array<CloudService>): void;
}

export interface EnvironmentStack extends Construct {
  readonly name: string;
  readonly scope: Construct;
  readonly defaults: object;
}
