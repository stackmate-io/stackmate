import { get } from 'lodash';
import { Memoize } from 'typescript-memoize';

import Entity from '@stackmate/lib/entity';
import Registry from '@stackmate/core/registry';
import Vault from '@stackmate/core/vault';
import Project from '@stackmate/core/project';
import App from '@stackmate/lib/terraform/app';
import Stack from '@stackmate/lib/terraform/stack';
import { Attribute } from '@stackmate/lib/decorators';
import { getCloudByProvider } from '@stackmate/clouds';
import { DEBUG_MODE, VAULT_PROVIDER } from '@stackmate/constants';
import { getVaultByProvider } from '@stackmate/vault';
import { parseObject, parseString } from '@stackmate/lib/parsers';
import { CloudProvider, CloudStack, Provisionable } from '@stackmate/interfaces';
import { AttributeParsers, NormalizedStage, ProjectDefaults, ProviderChoice, Validations } from '@stackmate/types';

class Stage extends Entity implements Provisionable {
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
  @Attribute defaults: ProjectDefaults;

  /**
   * @var {String} validationMessage the validation error message
   */
  readonly validationMessage: string = 'The stage’s configuration is invalid';

  /**
   * @var {Registry} registry the services registry
   */
  readonly registry: Registry;

  /**
   * @var {Vault} vault the secrets vault to use for service credentials
   */
  protected vault: Vault;

  /**
   * @var {App} app the terraform CDK app to create
   */
  protected app: App;

  /**
   * @constructor
   * @param {Vault} vault
   * @param {String} targetPath
   */
  constructor(vault: Vault, targetPath?: string) {
    super();

    this.registry = new Registry();
    this.vault = vault;
    this.app = new App({
      outdir: targetPath,
      stackTraces: DEBUG_MODE,
    });
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
        format: {
          pattern: '[a-z0-9-]+',
          flags: 'i',
          message: 'The stage’s can contain characters, numbers or dash eg. production or staging',
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
    return this.stack instanceof Stack && this.registry.length > 0;
  }

  /**
   * @returns {CloudStack} the stack for the stage
   */
  @Memoize() public get stack(): CloudStack {
    return new Stack(this.app, this.name);
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
   *
   * @void
   */
  provision(): void {
    if (this.isProvisioned) {
      throw new Error('Stage is already provisioned');
    }

    Object.keys(this.services).forEach((name: string) => {
      const { [name]: attributes, [name]: { type, provider, region } } = this.services;

      const service = this.cloud(provider, region).service(type, {
        ...attributes,
        // credentials: this.vault.credentials(this.name),
        // rootCredentials: this.vault.rootCredentials(this.name),
      });

      this.registry.add(service);
    });
  }

  /**
   * Synthesizes the stack
   * @void
   */
  synthesize(): void {
    this.provision();
    this.app.synth();
  }

  /**
   * Prepares a stage for deployment
   * @void
   */
  prepare(): void {
    // this.vault.provision();
    // this.state.provision();
    this.app.synth();
  }

  /**
   * Instantiates, validates and provisions a stage
   *
   * @param {Vault} vault the secrets vault to use
   * @param {object} attributes the stage's attributes
   * @param {String} targetPath the target path to write the output files to
   */
  static factory(vault: Vault, attributes: object, targetPath?: string): Stage {
    const stage = new Stage(vault, targetPath);
    stage.attributes = attributes;
    stage.validate();

    return stage;
  }

  /**
   * Loads a stage by project file and name
   *
   * @param {String} name the stage's name
   * @param {String} projectFile the project file
   * @param {String} targetPath the target path to write the output to
   * @returns {Stage}
   */
  static async fromFile(name: string, projectFile: string, targetPath?: string): Promise<Stage> {
    const project = new Project(projectFile);
    await project.load();

    const { secrets: { provider = VAULT_PROVIDER.AWS, ...vaultAttributes } } = project;

    const vault = await getVaultByProvider(provider, {
      ...vaultAttributes, provider, project: this.name, stage: name,
    });

    return Stage.factory(vault, {
      name,
      targetPath,
      defaults: project.defaults,
      services: get(project.stages, name, {}),
    });
  }
}

export default Stage;
