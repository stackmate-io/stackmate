import { snakeCase } from 'lodash';

import Entity from '@stackmate/lib/entity';
import { Attribute } from '@stackmate/lib/decorators';
import { CloudProvider, CloudStack, VaultService } from '@stackmate/interfaces';
import { parseArrayToUniqueValues } from '@stackmate/lib/parsers';
import { CloudPrerequisites, ProviderChoice, RegionList, ServiceMapping } from '@stackmate/types';

abstract class Cloud extends Entity implements CloudProvider {
  /**
 * @var {String} region the provider's region
 */
  @Attribute regions: RegionList;

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
   * @var {Object} serviceMapping a key value mapping of {service type => class}
   * @abstract
   * @readonly
   */
  abstract readonly serviceMapping: ServiceMapping;

  /**
   * Provisions the cloud
   * @param {CloudStack} stack the stack to provision
   * @param {VaultService} vault the vault providing the credentials
   */
  abstract provision(stack: CloudStack, vault?: VaultService): void;

  /**
   * @returns {CloudPrerequisites} the prerequisites for a service that is deployed in this cloud
   */
  abstract prerequisites(): CloudPrerequisites;

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
      regions: parseArrayToUniqueValues,
    };
  }

  /**
   * @returns {Validations} the validations to use in the entity
   */
  validations() {
    return {
      regions: {
        validateRegions: {
          availableRegions: Object.values(this.availableRegions),
        }
      },
    };
  }

  /**
   * Initializes the cloud provider
   *
   * We pick a region as a default, then set up an alias for the rest
   */
  protected initialize(): void {
    const { regions: { defaultRegion = this.defaultRegion, ...regions } } = this.attributes;

    this.aliases.set(this.defaultRegion, undefined);

    regions.forEach((region: string) => {
      this.aliases.set(region, snakeCase(`${this.provider}_${region}`));
    });
  }
}

export default Cloud;
