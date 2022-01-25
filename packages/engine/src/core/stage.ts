import { get, groupBy, map } from 'lodash';

import Entity from '@stackmate/lib/entity';
import Vault from '@stackmate/core/vault';
import { Attribute } from '@stackmate/lib/decorators';
import { getCloudByProvider } from '@stackmate/clouds';
import { parseObject, parseString } from '@stackmate/lib/parsers';
import { CloudProvider, CloudStack, ProjectStage } from '@stackmate/interfaces';
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
  readonly validationMessage: string = 'The stage’s configuration is invalid';

  /**
   * @var {CloudStack} stack the stack to deploy the stage to
   */
  readonly stack: CloudStack;

  /**
   * @var {Map} clouds the cloud instances instantiated for thsi stage
   */
  readonly clouds: Map<ProviderChoice, CloudProvider>;

  /**
   * @var {String} identifier the stage's identifier
   */
  readonly identifier: string;

  /**
   * @var {Vault} vault the secrets vault to use for service credentials
   */
  readonly vault: Vault;

  /**
   * @constructor
   * @param {CloudStack} stack the stack on which to deploy the stage
   * @param {Vault} vault the vault that handles credentials
   */
  constructor(stack: CloudStack, vault: Vault) {
    super();

    this.stack = stack;
    this.vault = vault;
    this.clouds = new Map();
  }

  /**
   * @returns {AttributeParsers} the parser functions to apply to the attributes
   */
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

  /**
   * Initializes the stage
   */
  protected initialize() {
    const servicesByProvider = groupBy(Object.values(this.services), 'provider');
    Object.keys(servicesByProvider).forEach(provider => {
      const services = servicesByProvider[provider];

      const cloud = getCloudByProvider(provider as ProviderChoice, this.stack, {
        regions: map(services, 'region'),
        defaults: get(this.defaults, provider, {}),
      });

      services.forEach(service => cloud.introduce(service));

      this.clouds.set(provider as ProviderChoice, cloud);
    });
  }

  provision() {
    // Provision all clouds
  }

  /**
   * Instantiates and validates a stage
   *
   * @param {Vault} vault the secrets vault to use
   * @param {object} attributes the stage's attributes
   * @param {String} targetPath the target path to write the output files to
   */
  static factory(stack: CloudStack, vault: Vault, attributes: object): Stage {
    const stage = new Stage(stack, vault);
    stage.attributes = attributes;
    stage.validate();
    return stage;
  }
}

export default Stage;
