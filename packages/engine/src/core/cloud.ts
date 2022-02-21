import { snakeCase } from 'lodash';

import Entity from '@stackmate/lib/entity';
import Parser from '@stackmate/lib/parsers';
import { Attribute } from '@stackmate/lib/decorators';
import { CloudProvider, CloudService } from '@stackmate/interfaces';
import { ProviderChoice, RegionList, ServiceAttributes } from '@stackmate/types';
import { ServicesRegistry } from '@stackmate/core/registry';
import { SERVICE_TYPE } from '@stackmate/constants';

abstract class Cloud extends Entity implements CloudProvider {
  /**
   * @var {Array<String>} region the provider's region
   */
  @Attribute regions: string[] = [];

  /**
   * @var {String} provider the provider's name
   * @abstract
   * @readonly
   */
  abstract readonly provider: ProviderChoice;

  /**
   * @var {Object} availableRegions the regions that the provider can deploy resources in
   * @abstract
   * @readonly
   */
  abstract readonly availableRegions: RegionList;

  /**
   * @var {Map} aliases the provider aliases to use, per region
   */
  readonly aliases: Map<string, string | undefined> = new Map();

  /**
   * @var {String} defaultRegion the default region to deploy core services to
   */
  protected defaultRegion: string;

  /**
   * @returns {String} the error message
   */
  public get validationMessage(): string {
    return `The configuration for the ${this.provider} cloud provider is invalid`;
  }

  /**
   * @returns {AttributeParsers} the parsers to use for the attributes
   */
  parsers() {
    return {
      regions: Parser.parseArrayToUniqueValues,
    };
  }

  /**
   * @returns {Validations} the validations to use in the entity
   */
  validations() {
    return {
      regions: {
        validateRegionList: {
          availableRegions: this.availableRegions,
        },
      },
    };
  }

  /**
   * @returns {String} the alias for the provider in the stack (eg. aws_eu_central_1)
   */
  public alias(region: string) : string {
    return snakeCase(`${this.provider}_${region}`);
  }

  /**
   * @returns {Array<ServiceAttributes>} the attributes for any prerequisites
   */
  prerequisites(): ServiceAttributes[] {
    return [];
  }

  /**
   * Instantiates a set of cloud services based on certain attributes
   *
   * @param {Array<ServiceAttributes>} serviceAttributes the attributes for the services
   * @returns {Array<CloudService>} the list of cloud service instances
   */
  services(serviceAttributes: ServiceAttributes[]): CloudService[] {
    const [primary, ...secondary] = this.regions;

    const attributes = [
      { type: SERVICE_TYPE.PROVIDER, region: primary },
      ...secondary.map(r => ({ type: SERVICE_TYPE.PROVIDER, r, alias: this.alias(r) })),
      ...this.prerequisites(),
      ...serviceAttributes,
    ];

    return attributes.map(attrs => (
      ServicesRegistry.get({ type: attrs.type, provider: this.provider }).factory(attrs)
    ));
  }
}

export default Cloud;
