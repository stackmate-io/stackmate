import { S3Backend, TerraformResource } from 'cdktf';

import AwsService from './base';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3';
import { AWS, CloudStack, CoreServiceConfiguration } from '@stackmate/engine/types';
import { DEFAULT_STATE_SERVICE_NAME, PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import { hashString, mergeJsonSchemas } from '@stackmate/engine/lib/helpers';

class AwsState extends AwsService<AWS.State.Attributes> implements AWS.State.Type {
  /**
   * @var {ServiceTypeChoice} type the service's type
   */
  readonly type = SERVICE_TYPE.STATE;

  /**
   * @var {String} name the service's name
   */
  name: string = DEFAULT_STATE_SERVICE_NAME;

  /**
   * @var {String} bucket the name of the bucket to store the files
   */
  bucket: string;

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

  /**
   * Provisioning when we initially prepare a stage
   *
   * @param {CloudStack} stack the stack to provision the service in
   * @void
   */
  onPrepare(stack: CloudStack): void {
    this.resources(stack);
  }

  /**
   * Provisioning when we deploy a stage
   *
   * @param {CloudStack} stack the stack to provision the service in
   * @void
   */
  onDeploy(stack: CloudStack): void {
    this.backend(stack);
  }

  /**
   * Provisioning on when we destroy destroy a stage
   *
   * @param {CloudStack} stack the stack to provision the service in
   * @void
   */
  onDestroy(stack: CloudStack): void {
    // The state has to be present when destroying resources
    this.backend(stack);
  }

  /**
   * @returns {Object} provides the structure to generate the JSON schema by
   */
  static schema(): AWS.State.Schema {
    return mergeJsonSchemas(super.schema(), {
      required: ['bucket'],
      properties: {
        bucket: {
          type: 'string',
        },
      },
      errorMessage: {
        required: {
          bucket: 'You have to provide a bucket to store the state to when using an AWS S3 state',
        },
      },
    });
  }

  /**
   * Returns the attributes to use when populating the initial configuration
   * @param {Object} options the options for the configuration
   * @returns {Object} the attributes
   */
  static config({ projectName = '', stageName = '' } = {}): CoreServiceConfiguration<AWS.State.Attributes> {
    return {
      provider: PROVIDER.AWS,
      bucket: [
        'stackmate-state',
        projectName ? hashString(projectName) : '',
        stageName].join('-'),
    };
  }
}

export default AwsState;
