import { get, groupBy, map, toPairs } from 'lodash';

import Entity from '@stackmate/lib/entity';
import Vault from '@stackmate/core/vault';
import Collection from '@stackmate/core/collection';
import { Attribute } from '@stackmate/lib/decorators';
import { getCloudByProvider } from '@stackmate/clouds';
import { parseObject, parseString } from '@stackmate/lib/parsers';
import { CloudCollection, CloudService, CloudStack, ProjectStage } from '@stackmate/interfaces';
import {
  AttributeParsers, NormalizedStage, ProjectDefaults, ProviderChoice, Validations,
} from '@stackmate/types';

class Stage extends Entity implements ProjectStage {
  /**
   * @var {String} name the stage's name
   */
  @Attribute name: string;

  /**
   * @var {NormalizedStage} services the services configuration
   */
  @Attribute services: NormalizedStage;

  /**
   * @var {Object} defaults the defaults to apply to the stage
   */
  @Attribute defaults: ProjectDefaults = {};

  /**
   * @var {String} validationMessage the validation error message
   */
  readonly validationMessage: string = 'The stage\'s configuration is invalid';

  /**
   * @var {CloudStack} stack the stack to deploy the stage to
   */
  readonly stack: CloudStack;

  /**
   * @var {Vault} vault the secrets vault to use for service credentials
   */
  readonly vault: Vault;

  /**
   * @var {Map} serviceCollection the collection of service instances
   */
  protected readonly serviceCollection: Map<string, CloudService>;

  /**
   * @var {Map} clouds the cloud instances instantiated for thsi stage
   */
  protected readonly cloudCollection: CloudCollection;

  /**
   * @constructor
   * @param {CloudStack} stack the stack on which to deploy the stage
   * @param {Vault} vault the vault that handles credentials
   */
  constructor(stack: CloudStack, vault: Vault) {
    super();

    this.stack = stack;
    this.vault = vault;
    this.cloudCollection = new Collection();
    this.serviceCollection = new Map();
  }

  parsers(): AttributeParsers {
    return {
      name: parseString,
      services: parseObject,
      defaults: parseObject,
    }
  }

  validations(): Validations {
    return {
      name: {
        presence: {
          allowEmpty: false,
          message: 'You have to provide a name for the stage',
        },
      },
      services: {
        presence: {
          allowEmpty: false,
          message: 'You have to provide the services for the stage',
        },
      },
      defaults: {},
    };
  }

  protected initialize(): void {
    const servicesByProvider = groupBy(Object.values(this.services), 'provider');

    toPairs(servicesByProvider).forEach(([provider, services]) => {
      // Add the cloud to the collection
      const cloudAttrs = {
        regions: map(services, 'region'),
        defaults: get(this.defaults, provider, {}),
      };

      this.cloudCollection.add(getCloudByProvider(provider as ProviderChoice, cloudAttrs));

      // Instantiate the services and add them to the collection
      // this.serviceCollection.set
    });
  }

  prepare() {
    const provisionables = [this.vault];
    this.cloudCollection.provision(this.stack, provisionables);
  }

  provision() {
    const provisionables = Array.from(this.serviceCollection.values());
    this.cloudCollection.provision(this.stack, provisionables, {
      vault: this.vault,
    });
  }
}

export default Stage;
