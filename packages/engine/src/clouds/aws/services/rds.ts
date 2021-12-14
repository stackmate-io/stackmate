import { isUndefined } from 'lodash';
import { DbInstance, DbParameterGroup } from '@cdktf/provider-aws/lib/rds';

import Database from '@stackmate/services/database';
import { DatabaseProvisioningProfile, DatabaseServiceAttributes, OneOf, ProviderChoice, RegionList } from '@stackmate/types';
import { DEFAULT_STORAGE, PROVIDER } from '@stackmate/constants';
import { Cached } from '@stackmate/lib/decorators';
import {
  DEFAULT_RDS_INSTANCE_SIZE,
  AWS_REGIONS,
  RDS_ENGINES,
  RDS_INSTANCE_SIZES,
  RDS_PARAM_FAMILY_MAPPING,
  DEFAULT_RDS_ENGINE,
  RDS_ENGINE_TO_DEFAULT_PORT,
  RDS_ENGINE_TO_DEFAULT_VERSION,
  RDS_MAJOR_VERSIONS_PER_ENGINE,
} from '@stackmate/clouds/aws/constants';

class AwsRdsService extends Database {
  /**
   * @var {String} provider the cloud provider for this service
   */
  readonly provider: ProviderChoice = PROVIDER.AWS;

  /**
   * @var {RegionList} regions the regions that the service is available in
   */
  readonly regions: RegionList = AWS_REGIONS;

  /**
   * @var {Array<string>} sizes the list of RDS instance sizes
   */
  readonly sizes = RDS_INSTANCE_SIZES;

  /**
   * @var {String} engine the database engine to use
   */
  engine: OneOf<typeof RDS_ENGINES>;

  /**
   * @var {Array<String>} engines the list of database engines available for this service
   */
  readonly engines: ReadonlyArray<string> = RDS_ENGINES;

  /**
   * @var {DbInstance} instance the rds instance, in case we're provisioning a single instance
   */
  public instance: DbInstance;

  /**
   * @var {DbParameterGroup} paramGroup the parameter group to use when provisioning an RDS resource
   */
  public paramGroup: DbParameterGroup;

  /**
   * @returns {Boolean} whether the service is provisioned
   */
  public get isProvisioned(): boolean {
    return !isUndefined(this.instance);
  }

  @Cached()
  public get paramGroupFamily() {
    const triad = RDS_PARAM_FAMILY_MAPPING.find(
      ([engine, version]) => engine === this.engine && this.version.startsWith(version),
    );

    if (!triad) {
      throw new Error(
        'We couldn’t determine the parameter group family to use based on your database’s version and engine',
      );
    }

    return triad[2];
  }

  /**
   * Returns the validations for the service
   *
   * @returns {Validations} the validations to run
   */
  validations(attributes?: Partial<DatabaseServiceAttributes>) {
    const validations = super.validations();
    const { engine } = attributes || {};
    const availableVersions = engine && RDS_MAJOR_VERSIONS_PER_ENGINE.has(engine)
      ? RDS_MAJOR_VERSIONS_PER_ENGINE.get(engine)
      : [];

    return {
      ...validations,
      version: {
        presence: {
          allowEmpty: false,
          message: 'You have to specify the database version to run',
        },
        validateVersion: {
          availableVersions,
        },
      },
    }
  }

  /**
   * Applies the defaults to the attributes
   *
   * @param {Object} attributes the attributes to apply the defaults to
   * @returns {DatabaseServiceAttributes}
   */
  applyDefaults(attributes: Partial<DatabaseServiceAttributes>): DatabaseServiceAttributes {
    const {
      nodes = 1,
      name = this.name,
      region = this.region,
      size = DEFAULT_RDS_INSTANCE_SIZE,
      engine = DEFAULT_RDS_ENGINE,
      storage = DEFAULT_STORAGE,
      port: databasePort,
      version: databaseVersion,
      database = '',
      rootCredentials = {},
    } = attributes;

    const port = databasePort || RDS_ENGINE_TO_DEFAULT_PORT.get(engine) || 0;
    const version = databaseVersion || RDS_ENGINE_TO_DEFAULT_VERSION.get(engine) || '';

    return {
      name, region, nodes, size, engine, storage, database, version, port, rootCredentials,
    };
  }

  provision() {
    const { username: rootUsername, password: rootPassword } = this.rootCredentials;
    const { instance, params } = this.provisioningProfile as DatabaseProvisioningProfile;
    const rootUsernameVar = this.variable('rootusername', rootUsername);
    const rootPasswordVar = this.variable('rootpassword', rootPassword);

    this.paramGroup = new DbParameterGroup(this.stack, `${this.identifier}-params`, {
      ...params,
      family: this.paramGroupFamily,
    });

    this.instance = new DbInstance(this.stack, this.name, {
      ...instance,
      allocatedStorage: this.storage,
      count: this.nodes,
      identifier: this.name,
      engine: this.engine,
      engineVersion: this.version,
      instanceClass: this.size,
      name: this.database,
      parameterGroupName: this.paramGroup.name,
      port: this.port,
      username: rootUsernameVar.value,
      password: rootPasswordVar.value,
      dbSubnetGroupName: `db-subnet-${this.identifier}`,
    });
  }
}

export default AwsRdsService;
