import Entity from '@stackmate/lib/entity';
import Registry from '@stackmate/core/registry';
import CloudManager from '@stackmate/core/manager';
import Stack from '@stackmate/core/stack';
import { Attribute } from '@stackmate/lib/decorators';
import { CloudStack, Provisionable } from '@stackmate/interfaces';
import { AttributeParsers, EntityAttributes, NormalizedStage, ProjectDefaults, Validations } from '@stackmate/types';
import { parseObject, parseString } from '@stackmate/lib/parsers';
import { createDirectory } from '@stackmate/lib/helpers';
import Vault from '@stackmate/core/vault';

class Stage extends Entity implements Provisionable {
  /**
   * @var {String} name the stage's name
   */
  @Attribute name: string;

  /**
   * @var {Vault} vault the vault containing the credentials
   */
  @Attribute vault: Vault;

  /**
   * @var {NormalizedStage} services the services configuration
   */
  @Attribute services: NormalizedStage;

  /**
   * @var {Object} defaults the defaults to apply to the stage
   */
  @Attribute defaults: ProjectDefaults;

  /**
   * @var {String} targetPath the path to write the output files to
   */
  @Attribute targetPath: string;

  /**
   * @var {String} validationMessage the validation error message
   */
  readonly validationMessage: string = 'The stage’s configuration is invalid';

  /**
   * @var {Registry} registry the services registry
   */
  readonly registry: Registry;

  /**
   * @var {CloudManager} clouds the class that handles the cloud services
   * @protected
   */
  protected clouds: CloudManager;

  /**
   * @var {Stack} stack the stack to use to provision the services with
   * @protected
   */
  protected stack: CloudStack;

  constructor() {
    super();

    this.registry = new Registry();
  }

  /**
   * @returns {AttributeParsers} the parser functions to apply to the attributes
   */
  parsers(): AttributeParsers {
    return {
      name: parseString,
      vault: parseObject,
      services: parseObject,
      defaults: parseObject,
      targetPath: parseString,
    }
  }

  validations(): Validations {
    return {
      name: {
        presence: {
          allowEmpty: false,
          message: 'You have to provide a name for the stage',
        },
        format: {
          pattern: '[a-z0-9-]+',
          flags: 'i',
          message: 'The stage’s can contain characters, numbers or dash eg. production or staging',
        },
      },
      vault: {
        validateInstanceType: { expected: Vault }
      },
      services: {
        presence: {
          allowEmpty: false,
          message: 'You have to provide the services for the stage',
        },
      },
      defaults: {
      },
      targetPath: {
        presence: {
          allowEmpty: false,
          message: 'You need to set a target output path for the stage',
        },
      }
    };
  }

  /**
   * @returns {Boolean} whether the stage is provisioned
   */
  public get isProvisioned(): boolean {
    return this.stack instanceof Stack && this.registry.length > 0;
  }

  /**
   * Provisions the stage
   */
  provision(): void {
    if (this.isProvisioned) {
      throw new Error('Stage is already provisioned');
    }

    // create target output path if it doesn't exist
    createDirectory(this.targetPath);

    this.stack = new Stack(this.name, this.targetPath);
    this.clouds = new CloudManager(this.stack, this.defaults);

    Object.keys(this.services).forEach((name: string) => {
      const { [name]: attributes, [name]: { type, provider, region } } = this.services;

      const service = this.clouds.get(provider, region).service(type, {
        ...attributes,
        credentials: this.vault.credentials(this.name),
        rootCredentials: this.vault.rootCredentials(this.name),
      });

      this.registry.add(service);
    });
  }

  /**
   * Synthesizes the stack
   * @void
   */
  synthesize() {
    this.stack.generate();
  }

  /**
   * Instantiates, validates and provisions a stage
   *
   * @param {EntityAttributes} attributes the stage's attributes
   * @param {Object} stack the terraform stack object
   * @param {Object} prerequisites any prerequisites by the cloud provider
   */
  static factory(attributes: EntityAttributes): Stage {
    const stage = new Stage();
    stage.attributes = attributes;

    stage.validate();
    stage.provision();

    return stage;
  }
}

export default Stage;
