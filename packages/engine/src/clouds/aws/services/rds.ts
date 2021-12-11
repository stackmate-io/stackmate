import { isUndefined } from 'lodash';
import { DbInstance } from '@cdktf/provider-aws/lib/rds';

import Database from '@stackmate/services/database';
import { ProviderChoice, RegionList } from '@stackmate/types';
import { PROVIDER } from '@stackmate/constants';
import {
  DEFAULT_RDS_INSTANCE_SIZE,
  DEFAULT_RDS_INSTANCE_STORAGE,
  AWS_REGIONS,
  RDS_ENGINES,
  RDS_INSTANCE_SIZES,
} from '@stackmate/clouds/aws/constants';

class AwsRdsService extends Database {
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
   * @var {Array<String>} engines the list of database engines available for this service
   */
  readonly engines: ReadonlyArray<string> = RDS_ENGINES;

  /**
   * @var {DbInstance} instance the rds instance, in case we're provisioning a single instance
   */
  public instance: DbInstance;

  /**
   * @returns {Boolean} whether the service is provisioned
   */
  public get isProvisioned(): boolean {
    return !isUndefined(this.instance);
  }

  /**
   * @returns {Boolean} whether we should provision a cluster
   */
  public get useCluster(): boolean {
    return this.engine.startsWith('aurora');
  }

  provision() {
    const { username: rootUsername, password: rootPassword } = this.rootCredentials;
    const rootUsernameVar = this.variable('rootusername', rootUsername);
    const rootPasswordVar = this.variable('rootpassword', rootPassword);

    this.instance = new DbInstance(this.stack, this.name, {
      instanceClass: this.size,
    });
  }
}

export default AwsRdsService;
