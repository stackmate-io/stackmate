import { isUndefined } from 'lodash';
import { DbInstance, DbParameterGroup } from '@cdktf/provider-aws/lib/rds';

import Database from '@stackmate/services/database';
import { DatabaseProvisioningProfile, OneOf, ProviderChoice, RegionList } from '@stackmate/types';
import { PROVIDER } from '@stackmate/constants';
import { Cached } from '@stackmate/lib/decorators';
import {
  DEFAULT_RDS_INSTANCE_SIZE,
  DEFAULT_RDS_INSTANCE_STORAGE,
  AWS_REGIONS,
  RDS_ENGINES,
  RDS_INSTANCE_SIZES,
  RDS_PARAM_FAMILY_MAPPING,
} from '@stackmate/clouds/aws/constants';

class AwsRdsService extends Database {
  /**
   * @var {Map} ENGINE_TO_PORT the mapping for every engine to port
   * @static
   */
  static ENGINE_TO_PORT: Map<OneOf<typeof RDS_ENGINES>, number> = new Map([
    ['mariadb', 3306],
    ['mysql', 3306],
    ['postgres', 5432],
  ]);

  /**
   * @var {String} provider the cloud provider for this service
   */
  readonly provider: ProviderChoice = PROVIDER.AWS;

  /**
   * @var {String} size the size for the RDS instance
   */
  size: string = DEFAULT_RDS_INSTANCE_SIZE;

  /**
   * @var {Number} storage the storage size for the instance
   */
  storage: number = DEFAULT_RDS_INSTANCE_STORAGE;

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

  @Cached()
  public get defaultPort(): number {
    const port = AwsRdsService.ENGINE_TO_PORT.get(this.engine);

    if (!port) {
      throw new Error(`Port is not defined for engine ${this.engine}`);
    }

    return port;
  }

  provision() {
    const { username: rootUsername, password: rootPassword } = this.rootCredentials;
    const rootUsernameVar = this.variable('rootusername', rootUsername);
    const rootPasswordVar = this.variable('rootpassword', rootPassword);
    const { instance, params } = this.provisioningProfile as DatabaseProvisioningProfile;

    this.paramGroup = new DbParameterGroup(this.stack, this.name, {
      ...params,
      name: this.identifier,
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
