import { snakeCase } from 'lodash';

import Entity from '@stackmate/lib/entity';
import Parser from '@stackmate/lib/parsers';
import { Attribute } from '@stackmate/lib/decorators';
import { CloudProvider, CloudService, CloudStack, VaultService } from '@stackmate/interfaces';
import { CloudPrerequisites, ProviderChoice, RegionList, ServiceAttributes } from '@stackmate/types';
import { ServicesRegistry } from '@stackmate/core/registry';

abstract class Cloud extends Entity implements CloudProvider {
  /**
   * @var {String} region the provider's region
   */
  @Attribute region: string;

  /**
   * @var {Boolean} isDefault whether this is the default provider
   */
  @Attribute isDefault: boolean;

  /**
   * @var {String} provider the provider's name
   * @abstract
   * @readonly
   */
  abstract readonly provider: ProviderChoice;

  /**
   * @var {Object} regions the regions that the provider can deploy resources in
   * @abstract
   * @readonly
   */
  abstract readonly regions: RegionList;

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
      region: Parser.parseString,
    };
  }

  /**
   * @returns {Validations} the validations to use in the entity
   */
  validations() {
    const regions = Object.values(this.regions);

    return {
      region: {
        presence: {
          allowEmpty: false,
          message: 'You have to provide a region for the provider',
        },
        inclusion: {
          within: regions,
          message: `The region for this service is invalid. Available options are: ${regions.join(', ')}`,
        },
      },
    };
  }

  /**
   * @returns {String|undefined} the alias for the provider in the stack (eg. aws_eu_central_1)
   */
  public get alias() : string | undefined {
    if (!this.isDefault) {
      return snakeCase(`${this.provider}_${this.region}`);
    }
  }

  /**
   * Instantiates a set of cloud services based on certain attributes
   *
   * @param {Array<ServiceAttributes>} serviceAttributes the attributes for the services
   * @returns {Array<CloudService>} the list of cloud service instances
   */
  services(serviceAttributes: ServiceAttributes[]): CloudService[] {
    return serviceAttributes.map(attributes => (
      ServicesRegistry.get({ type: attributes.type, provider: this.provider }).factory({
        ...attributes,
        providerAlias: this.alias,
      })
    ));
  }
}

export default Cloud;
