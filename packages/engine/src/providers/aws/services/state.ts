import pipe from '@bitty/pipe';
import { S3Backend } from 'cdktf';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3';

import { SERVICE_TYPE } from '@stackmate/engine/constants';
import { DEFAULT_REGION, REGIONS } from '@stackmate/engine/providers/aws/constants';
import { AwsServiceAttributes, getAwsCoreService } from '@stackmate/engine/providers/aws/service';
import {
  CoreServiceAttributes, Provisionable,
  ProvisionAssociationRequirements, Service, withRegions,
} from '@stackmate/engine/core/service';

type AwsStatePreparableProvisions = { bucket: S3Bucket };
type AwsStateDeployableResources = { backend: S3Backend };
type AwsStateDestroyableProvisions = { backend: S3Backend };

export type AwsStateAttributes = AwsServiceAttributes<CoreServiceAttributes & {
  type: typeof SERVICE_TYPE.STATE
}>;

export type AwsStateService = Service<AwsStateAttributes>;

type AwsStateBaseProvisionable = Provisionable & {
  id: string;
  config: AwsStateAttributes;
  service: AwsStateService;
};

export type AwsStateDeployableProvisionable = AwsStateBaseProvisionable & {
  provisions: AwsStateDeployableResources;
  requirements: ProvisionAssociationRequirements<AwsStateService['associations'], 'deployable'>;
};

export type AwsStateDestroyableProvisionable = AwsStateBaseProvisionable & {
  provisions: AwsStateDestroyableProvisions;
  requirements: ProvisionAssociationRequirements<AwsStateService['associations'], 'destroyable'>;
};

export type AwsStatePreparableProvisionable = AwsStateBaseProvisionable & {
  provisions: AwsStatePreparableProvisions;
  requirements: ProvisionAssociationRequirements<AwsStateService['associations'], 'preparable'>;
};

/**
 * @returns {AwsSecretsVaultService} the secrets vault service
 */
export const getStateService = (): AwsStateService => (
  pipe(
    withRegions(REGIONS, DEFAULT_REGION),
  )(getAwsCoreService(SERVICE_TYPE.STATE))
);

export const AwsState = getStateService();
