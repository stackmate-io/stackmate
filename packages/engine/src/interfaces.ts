import { Construct } from 'constructs';

import {
  ServiceAttributes, ServiceAssociation,
  ServiceMapping, ServiceTypeChoice, ProviderChoice, ServiceAssociationDeclarations, RegionList,
} from 'types';

export interface ICloudManager {
  readonly provider: ProviderChoice;
  readonly regions: RegionList;
  readonly serviceMapping: ServiceMapping;
  init(): void;
  prepare(): void;
  register(type: ServiceTypeChoice, name: string, attrs: ServiceAttributes): IService;
}

export interface IService {
  readonly name: string;
  readonly provider: ProviderChoice;
  readonly type: ServiceTypeChoice;
  associations: ServiceAssociationDeclarations;
  validate(): void;
  requires(): Array<ServiceAssociation>;
  provision(): void;
  associate(associations: Array<IService>): void;
};

export interface IStack extends Construct {
  readonly name: string;
  readonly scope: Construct;
  readonly defaults: object;
};
