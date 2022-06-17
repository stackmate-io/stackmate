import { S3Backend } from 'cdktf';

import AwsService from './base';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3';
import { AWS, CloudStack, CoreServiceConfiguration, RequireKeys } from '@stackmate/engine/types';
import { DEFAULT_STATE_SERVICE_NAME, PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import { mergeJsonSchemas, uniqueIdentifier } from '@stackmate/engine/lib/helpers';
import { AwsServicePrerequisites } from '@stackmate/engine/types/service/aws';

class AwsState extends AwsService<AWS.State.Attributes> implements AWS.State.Type {
  /**
   * @var {String} schemaId the schema id for the entity
   * @static
   */
  static schemaId: string = 'services/aws/state';

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
   * Provisions the resources that provide state storage
   *
   * @param {CloudStack} stack the stack to register the resources to
   */
  resources(stack: CloudStack, prerequisites: RequireKeys<AwsServicePrerequisites, 'provider'>): void {
    new S3Bucket(stack, this.identifier, {
      acl: 'private',
      bucket: this.bucket,
      provider: prerequisites.provider.resource,
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
  backend(stack: CloudStack, prerequisites: RequireKeys<AwsServicePrerequisites, 'provider'>): void {
    new S3Backend(stack, {
      acl: 'private',
      bucket: this.bucket,
      encrypt: true,
      key: `${this.projectName}/${this.stageName}/terraform.tfstate`,
      kmsKeyId: prerequisites.provider.key.id,
      region: this.region,
    });
  }

  /**
   * Provisioning when we initially prepare a stage
   *
   * @param {CloudStack} stack the stack to provision the service in
   * @void
   */
  onPrepare(stack: CloudStack, prerequisites: RequireKeys<AwsServicePrerequisites, 'provider'>): void {
    this.resources(stack, prerequisites);
  }

  /**
   * Provisioning when we deploy a stage
   *
   * @param {CloudStack} stack the stack to provision the service in
   * @void
   */
  onDeploy(stack: CloudStack, prerequisites: RequireKeys<AwsServicePrerequisites, 'provider'>): void {
    this.backend(stack, prerequisites);
  }

  /**
   * Provisioning on when we destroy destroy a stage
   *
   * @param {CloudStack} stack the stack to provision the service in
   * @void
   */
  onDestroy(stack: CloudStack, prerequisites: RequireKeys<AwsServicePrerequisites, 'provider'>): void {
    // The state has to be present when destroying resources
    this.backend(stack, prerequisites);
  }

  /**
   * @returns {BaseJsonSchema} provides the JSON schema to validate the entity by
   */
  static schema(): AWS.State.Schema {
    return mergeJsonSchemas(super.schema(), {
      $id: this.schemaId,
      required: ['bucket'],
      properties: {
        name: {
          default: DEFAULT_STATE_SERVICE_NAME,
        },
        type: {
          default: SERVICE_TYPE.STATE,
        },
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
   * @returns {Object} the attributes to use when populating the initial configuration
   */
  static config({ projectName = '' } = {}): CoreServiceConfiguration<AWS.State.Attributes> {
    return {
      provider: PROVIDER.AWS,
      bucket: uniqueIdentifier('stackmate-state', { projectName }),
    };
  }
}

export default AwsState;
