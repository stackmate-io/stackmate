import { S3Backend, TerraformResource } from 'cdktf';

import State from '@stackmate/engine/core/services/state';
import AwsService from '@stackmate/engine/providers/aws/mixins';
import { CloudStack } from '@stackmate/engine/types';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3';
import { Attribute } from '@stackmate/engine/lib/decorators';

const AwsStateService = AwsService(State);

class AwsStateBucket extends AwsStateService {
  /**
   * @var {String} bucket the name of the bucket to store the files
   */
  @Attribute bucket: string;

  /**
   * @var {TerraformResource} bucket the bucket to provision
   */
  bucketResource: TerraformResource;

  /**
   * @var {DataTerraformRemoteStateS3} dataResource the data resource to use when registering the state
   */
  backendResource: S3Backend;

  /**
   * @returns {Boolean} whether the state service is registered
   */
  isRegistered(): boolean {
    return Boolean(this.bucketResource) || Boolean(this.backendResource);
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
  backend(stack: CloudStack): void {
    this.backendResource = new S3Backend(stack, {
      acl: 'private',
      bucket: this.bucket,
      encrypt: true,
      key: `${this.projectName}/${this.stageName}/terraform.tfstate`,
      kmsKeyId: this.providerService.key.id,
      region: this.region,
    });
  }
}

export default AwsStateBucket;
