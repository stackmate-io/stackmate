import Service from 'core/service';
import { AwsVpcService } from 'clouds/aws/services/vpc';
import { ProviderChoice, ServiceAssociation } from 'types';
import { PROVIDER } from 'core/constants';

abstract class AwsService extends Service {
  readonly provider: ProviderChoice = PROVIDER.AWS;

  requires(): Array<ServiceAssociation> {
    return [{
      lookup: AwsVpcService,
      onRegister: ([vpc]): void => this.handleVpcAssociated(vpc as AwsVpcService),
    }];
  }

  handleVpcAssociated(vpc: AwsVpcService) {
  }
}

export default AwsService;
