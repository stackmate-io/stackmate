import { AwsProvider } from '@cdktf/provider-aws';

import Cloud from 'core/cloud';
import { PROVIDER, SERVICE_TYPE } from 'core/constants';
import { CloudPrerequisites, ProviderChoice, RegionList, ServiceMapping } from 'types';
import { AWS_REGIONS } from 'clouds/aws/constants';
import { AwsMysqlService, AwsPostgresqlService } from 'clouds/aws/services/rds';
import { AwsVpcService } from 'clouds/aws/services/vpc';

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

  private _cloudProvider: AwsProvider; // tslint-disable-line: 6133

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
