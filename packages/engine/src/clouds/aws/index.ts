import { AwsProvider } from '@cdktf/provider-aws';

import Cloud from 'core/cloud';
import { PROVIDER, SERVICE_TYPE } from 'core/constants';
import { IService } from 'interfaces';
import { ProviderChoice, RegionList, ServiceMapping } from 'types';
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

  protected prerequisites: Array<IService> = [];

  init(): void {
    new AwsProvider(this.stack, PROVIDER.AWS, { region: this.region });

    this.prerequisites = [
      new AwsVpcService({
        name: 'default-vpc',
      }),
    ];
  }
}

export {
  AwsCloud,
  AwsMysqlService,
  AwsPostgresqlService,
  AwsVpcService,
  AWS_SERVICE_MAPPING as AwsServiceMapping,
};
