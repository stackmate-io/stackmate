import AwsProvider from '@stackmate/providers/aws/services/aws';
import AwsRdsService from '@stackmate/providers/aws/services/rds';
import AwsSsmParamsService from '@stackmate/providers/aws/services/vault';

export {
  AwsProvider as Provider,
  AwsRdsService as Database,
  AwsSsmParamsService as Vault,
};
