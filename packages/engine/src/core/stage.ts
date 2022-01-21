import { get } from 'lodash';
import { Memoize } from 'typescript-memoize';

import Entity from '@stackmate/lib/entity';
import Registry from '@stackmate/core/registry';
import Vault from '@stackmate/core/vault';
import { Attribute } from '@stackmate/lib/decorators';
import { getCloudByProvider } from '@stackmate/clouds';
import { parseObject, parseString } from '@stackmate/lib/parsers';
import { CloudProvider, CloudStack, ProjectStage } from '@stackmate/interfaces';
import { AttributeParsers, NormalizedStage, ProjectDefaults, ProviderChoice, Validations } from '@stackmate/types';

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
   * @var {Registry} registry the services registry
   */
  readonly registry: Registry;

  /**
   * @var {CloudStack} stack the stack to deploy the stage to
   */
  readonly stack: CloudStack;

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
   * @param {Vault} vault the vault that is used to provision credentials
   */
  constructor(stack: CloudStack, vault: Vault) {
    super();

    this.stack = stack;
    this.vault = vault;
    this.registry = new Registry();
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
   * @returns {Boolean} whether the stage is provisioned
   */
  public get isProvisioned(): boolean {
    return this.registry.length > 0;
  }

  /**
   * Returns a cloud provider instance
   *
   * @param {ProviderChoice} provider The provider to get as a cloud instance
   * @param {String} region The cloud region to use
   * @returns {CloudProvider} the instance of the cloud provider
   */
  @Memoize((...args: any[]) => args.join(':'))
  public cloud(provider: ProviderChoice, region: string): CloudProvider {
    const attributes = { region, defaults: get(this.defaults, provider, {}) };
    return getCloudByProvider(provider, attributes, this.stack);
  }

  /**
   * Provisions the stage
   * @void
   */
  provision(): void {
    if (this.isProvisioned) {
      throw new Error('Stage is already provisioned');
    }

    this.vault.provision();

    Object.keys(this.services).forEach((name: string) => {
      const { [name]: attributes } = this.services;
      const { type, provider, region } = attributes;

      const service = this.cloud(provider, region).service(type, attributes);

      this.registry.add(service);
      this.vault.link(service);
    });
  }

  /**
   * Instantiates, validates and provisions a stage
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
