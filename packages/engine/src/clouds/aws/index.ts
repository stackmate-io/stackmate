import { AwsProvider } from '@cdktf/provider-aws';

import Cloud from '@stackmate/core/cloud';
import { PROVIDER, SERVICE_TYPE, AWS_REGIONS } from '@stackmate/core/constants';
import { CloudPrerequisites, ProviderChoice, RegionList, ServiceMapping } from '@stackmate/types';
import { AwsMysqlService, AwsPostgresqlService } from '@stackmate/clouds/aws/services/rds';
import { AwsVpcService } from '@stackmate/clouds/aws/services/vpc';

export const AWS_SERVICE_MAPPING: ServiceMapping = {
  [SERVICE_TYPE.MYSQL]: AwsMysqlService,
  [SERVICE_TYPE.POSTGRESQL]: AwsPostgresqlService,
  [SERVICE_TYPE.NETWORKING]: AwsVpcService,
};

class AwsCloud extends Cloud {
  /**
   * @var {String} provider the provider's name
   * @readonly
   */
  readonly provider: ProviderChoice = PROVIDER.AWS;

  readonly regions: RegionList = AWS_REGIONS;

  readonly serviceMapping: ServiceMapping = AWS_SERVICE_MAPPING;

  protected prerequisites: CloudPrerequisites = {};

  init(): void {
    /* eslint-disable-next-line no-new */
    new AwsProvider(this.stack, PROVIDER.AWS, {
      region: this.region,
    });

    this.prerequisites = {
      vpc: this.service({
        type: SERVICE_TYPE.NETWORKING,
        name: 'my-vpc',
        region: this.region,
      }),
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
