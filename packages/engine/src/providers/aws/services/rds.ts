import { isUndefined } from 'lodash';
import { Memoize } from 'typescript-memoize';
import { DbInstance, DbParameterGroup } from '@cdktf/provider-aws/lib/rds';

import AwsService from '@stackmate/engine/providers/aws/services/base';
import { DEFAULT_SERVICE_STORAGE } from '@stackmate/engine/constants';
import { mergeJsonSchemas } from '@stackmate/engine/lib/helpers';
import { AWS, CloudStack, OneOf } from '@stackmate/engine/types';
import {
  RDS_ENGINES,
  RDS_INSTANCE_SIZES,
  RDS_PARAM_FAMILY_MAPPING,
  RDS_LOG_EXPORTS_PER_ENGINE,
  DEFAULT_RDS_INSTANCE_SIZE,
} from '@stackmate/engine/providers/aws/constants';

abstract class AwsRdsService<Attrs extends AWS.Database.Attributes> extends AwsService<Attrs> implements AWS.Database.Type {
  /**
   * @var {String} size the size for the RDS instance
   */
  size: OneOf<typeof RDS_INSTANCE_SIZES> = DEFAULT_RDS_INSTANCE_SIZE;

  /**
   * @var {String} nodes the numbe of nodes to deploy
   */
  nodes: number = 1;

  /**
   * @var {Number} storage the storage size for the instance
   */
  storage: number;

  /**
   * @var {String} database the database to create
   */
  database: string;

  /**
   * @var {Number} the port number to use to connect to the database
   */
  port: number;

  /**
   * @var {String} version the database version to run
   */
  version: string;

  /**
   * @var {String} engine the database engine to use
   */
  engine: OneOf<typeof RDS_ENGINES>;

  /**
   * @var {DbInstance} instance the rds instance, in case we're deploying a single instance
   */
  public instance: DbInstance;

  /**
   * @var {DbParameterGroup} paramGroup the parameter group to use when deploying an RDS resource
   */
  public paramGroup: DbParameterGroup;

  /**
   * @returns {Boolean} whether the service is registered
   */
  isRegistered(): boolean {
    return !isUndefined(this.instance) && !isUndefined(this.paramGroup);
  }

  /**
   * @returns {String} the RDS parameter group family to use when deploying the service
   */
  @Memoize() public get paramGroupFamily() {
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

  onDeploy(stack: CloudStack): void {
    const { instance, params } = this.resourceProfile;
    const { username, password } = this.vault.credentials(stack, this.name, { root: true });

    this.paramGroup = new DbParameterGroup(stack, `${this.identifier}-params`, {
      ...params,
      family: this.paramGroupFamily,
    });

    this.instance = new DbInstance(stack, this.name, {
      ...instance,
      allocatedStorage: this.storage,
      count: this.nodes,
      enabledCloudwatchLogsExports: RDS_LOG_EXPORTS_PER_ENGINE.get(this.engine),
      engine: this.engine,
      engineVersion: this.version,
      identifier: this.identifier,
      instanceClass: this.size,
      name: this.database,
      parameterGroupName: this.paramGroup.name,
      port: this.port,
      provider: this.providerService.resource,
      dbSubnetGroupName: `db-subnet-${this.identifier}`,
      username,
      password,
      lifecycle: {
        createBeforeDestroy: true,
      },
    });
  }

  static schema(): AWS.Database.Schema {
    return mergeJsonSchemas(super.schema(), {
      required: ['size', 'nodes', 'engine', 'port', 'version'],
      properties: {
        size: {
          type: 'string',
          default: DEFAULT_RDS_INSTANCE_SIZE,
          enum: RDS_INSTANCE_SIZES,
        },
        storage: {
          type: 'number',
          default: DEFAULT_SERVICE_STORAGE,
        },
        nodes: {
          type: 'number',
          default: 1,
          minimum: 1,
        },
        engine: {
          type: 'string',
          enum: RDS_ENGINES,
        },
        version: {
          type: 'string',
        },
        database: {
          type: 'string',
          pattern: '[a-z0-9_]+',
        },
        port: {
          type: 'number',
          minimum: 0,
          maximum: 65535,
        },
      },
    });
  }
}

export default AwsRdsService;
