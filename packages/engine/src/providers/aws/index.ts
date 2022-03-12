import AwsProvider from '@stackmate/providers/aws/services/aws';
import AwsRdsService from '@stackmate/providers/aws/services/database';
import AwsSsmParamsService from '@stackmate/providers/aws/services/vault';
import AwsS3State from '@stackmate/providers/aws/services/state';

export {
  AwsProvider as Provider,
  AwsRdsService as Database,
  AwsSsmParamsService as Vault,
  AwsS3State as State,
};
