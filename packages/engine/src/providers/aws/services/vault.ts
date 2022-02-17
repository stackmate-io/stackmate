import Vault from '@stackmate/core/services/vault';
import AwsService from '@stackmate/providers/aws/mixins';
import Parser from '@stackmate/lib/parsers';
import { Attribute } from '@stackmate/lib/decorators';
import { AWS_REGIONS } from '@stackmate/providers/aws/constants';
import { RegisterService } from '@stackmate/lib/decorators';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/constants';
import { CredentialsResource, CloudStack, VaultService } from '@stackmate/interfaces';

const { AWS } = PROVIDER;
const { VAULT } = SERVICE_TYPE;

const AwsVaultService = AwsService(Vault);

@RegisterService(AWS, VAULT) class AwsSsmParamsService extends AwsVaultService {
  /**
   * @var {String} key the key arn to use for encryption / decryption
   */
  @Attribute key: string;

  /**
   * @var {String} region the region that the params are stored into
   */
  @Attribute region: string;

  /**
   * @returns {AttributeParsers}
   */
  parsers() {
    return {
      ...super.parsers(),
      key: Parser.parseString,
      region: Parser.parseString,
    };
  }

  /**
   * @returns {Validations}
   */
  validations() {
    return {
      ...super.validations(),
      key: {
        presence: {
          message: 'A key in the form of a KMS ARN should be specified',
        },
        format: {
          pattern: '^arn:aws:[a-z0-9-:]+:[0-9]+(:[a-z0-9]+)?/[a-z0-9-]+$',
          flags: 'i',
          message: 'Please provide a valid KMS ARN (eg. arn:aws:eu-central-1:11111111/abc-123-abc)',
        },
      },
      region: {
        presence: {
          message: 'A region should be specified',
          allowEmpty: false,
        },
        inclusion: {
          within: Object.values(AWS_REGIONS),
          message: 'The region specified is not valid',
        },
      },
    }
  }

  get isRegistered(): boolean {
    throw new Error('Method not implemented.');
  }

  provide(service: string, key: 'username' | 'password', root: boolean): CredentialsResource {
    throw new Error('Method not implemented.');
  }

  provision(stack: CloudStack, vault?: VaultService, providerAlias?: string): void {
    throw new Error('Method not implemented.');
  }
}

export default AwsSsmParamsService;
