import pipe from '@bitty/pipe';
import { join as joinPaths } from 'node:path';
import { LocalBackend } from 'cdktf';

import { Stack } from '@stackmate/engine/core/stack';
import { SERVICE_TYPE, USER_HOME_DIRECTORY } from '@stackmate/engine/constants';
import { getLocalService, LocalServiceAssociations, LocalServiceAttributes } from '@stackmate/engine/providers/local/service';
import {
  BaseServiceAttributes, Provisionable, ProvisionAssociationRequirements,
  Service, withHandler, withSchema,
} from '@stackmate/engine/core/service';

export type LocalStateResources = { backend: LocalBackend };

export type LocalStateAttributes = LocalServiceAttributes<BaseServiceAttributes & {
  type: typeof SERVICE_TYPE.STATE;
  path?: string;
  directory?: string;
}>;

export type LocalStateService = Service<LocalStateAttributes> & {
  associations: LocalServiceAssociations;
};

export type LocalStateProvisionable = Provisionable & {
  config: LocalStateAttributes;
  service: LocalStateService;
  provisions: LocalStateResources;
  requirements: ProvisionAssociationRequirements<
    LocalStateService['associations'], 'deployable'
  >;
};

export const onPrepare = (
  provisionable: LocalStateProvisionable, stack: Stack,
): LocalStateResources => {
  const { config } = provisionable
  const path = config.path || `${stack.stageName.toLowerCase()}-initial.tfstate`;;
  const workspaceDir = config.directory || joinPaths(
    USER_HOME_DIRECTORY, stack.projectName.toLocaleLowerCase(),
  );

  const backend = new LocalBackend(stack.context, { path, workspaceDir });
  return { backend };
};

/**
 * @returns {AwsSecretsVaultService} the secrets vault service
 */
export const getStateService = (): LocalStateService => (
  pipe(
    withHandler('preparable', onPrepare),
    withSchema({
      type: 'object',
      properties: {
        path: { type: 'string' },
        directory: { type: 'string' },
      },
    }),
  )(getLocalService(SERVICE_TYPE.STATE))
);

export const LocalState = getStateService();
