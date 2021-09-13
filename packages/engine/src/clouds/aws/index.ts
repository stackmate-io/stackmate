import { AwsProvider } from '@cdktf/provider-aws';

import Cloud from '@stackmate/core/cloud';
import { PROVIDER, SERVICE_TYPE, AWS_REGIONS } from '@stackmate/core/constants';
import { CloudPrerequisites, ProviderChoice, RegionList, ServiceMapping } from '@stackmate/types';
import { AwsMysqlService, AwsPostgresqlService } from '@stackmate/clouds/aws/services/rds';
import { AwsVpcService } from '@stackmate/clouds/aws/services/vpc';

export const AWS_SERVICE_MAPPING: ServiceMapping = new Map([
  [SERVICE_TYPE.MYSQL, AwsMysqlService],
  [SERVICE_TYPE.POSTGRESQL, AwsPostgresqlService],
  [SERVICE_TYPE.NETWORKING, AwsVpcService],
]);

class AwsCloud extends Cloud {
  readonly provider: ProviderChoice = PROVIDER.AWS;

  readonly regions: RegionList = AWS_REGIONS;

  readonly serviceMapping: ServiceMapping = AWS_SERVICE_MAPPING;

  protected prerequisites: CloudPrerequisites = {};

  // tslint:disable-next-line:ts(6133)
  private _cloudProvider: AwsProvider;

  init(): void {
    this._cloudProvider = new AwsProvider(this.stack, PROVIDER.AWS, {
      region: this.region,
    });

    this.prerequisites = {
      vpc: new AwsVpcService('my-stage-vpc', {}, this.stack),
    };
  }
}

export {
  AwsCloud,
  AwsMysqlService,
  AwsPostgresqlService,
  AwsVpcService,
  AWS_SERVICE_MAPPING as AwsServiceMapping,
};
