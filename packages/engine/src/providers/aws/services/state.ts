import { S3Backend, TerraformResource } from 'cdktf';

import State from '@stackmate/core/services/state';
import AwsService from '@stackmate/providers/aws/mixins';
import { CloudStack } from '@stackmate/interfaces';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3';
import { Attribute } from '@stackmate/lib/decorators';
import Parser from '@stackmate/lib/parsers';

const AwsStateService = AwsService(State);

class AwsStateBucket extends AwsStateService {
  /**
   * @var {String} bucket the name of the bucket to store the files
   */
  @Attribute bucket: string;

  /**
   * @var {String} key the key arn to use for encryption / decryption
   */
  @Attribute key: string;

  /**
   * @var {TerraformResource} bucket the bucket to provision
   */
  bucketResource: TerraformResource;

  /**
   * @var {DataTerraformRemoteStateS3} dataResource the data resource to use when registering the state
   */
  backend: S3Backend;

  /**
   * @returns {Boolean} whether the state service is registered
   */
  get isRegistered(): boolean {
    return Boolean(this.bucket) || Boolean(this.backend);
  }

  /**
   * @returns {AttributeParsers}
   */
  parsers() {
    return {
      ...super.parsers(),
      bucket: Parser.parseString,
      key: Parser.parseString,
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
        validateAwsArn: {
          message: 'Please provide a valid KMS ARN (eg. arn:aws:eu-central-1:11111111/abc-123-abc)',
        },
      },
      bucket: {
        presence: {
          message: 'A bucket name is required for the state storage',
        },
        format: {
          pattern: '[a-z0-9-]+',
          flags: 'i',
          message: 'The bucket name can only contain alphanumeric characters and dashes',
        },
      },
    }
  }

  /**
   * Provisions the resources that provide state storage
   *
   * @param {CloudStack} stack the stack to register the resources to
   */
  resources(stack: CloudStack): void {
    this.bucketResource = new S3Bucket(stack, this.identifier, {
      acl: 'private',
      bucket: this.bucket,
      provider: this.providerService.resource,
      versioning: {
        enabled: true,
        mfaDelete: true,
      },
    });
  }

  /**
   * Provisions the data resource for the state
   *
   * @param {CloudStack} stack the stack to register the data resources to
   */
  data(stack: CloudStack): void {
    this.backend = new S3Backend(stack, {
      acl: 'private',
      bucket: this.bucket,
      encrypt: true,
      key: `${this.projectName}/${this.stageName}/terraform.tfstate`,
      kmsKeyId: this.key,
      region: this.region,
    });
  }
}

export default AwsStateBucket;
