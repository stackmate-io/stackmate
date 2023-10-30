import { join as joinPaths } from 'node:path';
import pipe from 'lodash/fp/pipe';
import { LocalBackend } from 'cdktf';

import { Stack } from '@core/stack';
import { SERVICE_TYPE, USER_HOME_DIRECTORY } from '@constants';
import {
  getLocalService, LocalServiceAssociations, LocalServiceAttributes,
} from '@providers/local/service';
import {
  BaseServiceAttributes, Provisionable, Service, withHandler, withSchema,
} from '@core/service';

export type LocalStateResources = { backend: LocalBackend };

export type LocalStateAttributes = LocalServiceAttributes<BaseServiceAttributes & {
  type: typeof SERVICE_TYPE.STATE;
  path?: string;
  directory?: string;
}>;

export type LocalStateService = Service<LocalStateAttributes> & {
  associations: LocalServiceAssociations;
};

export type LocalStateProvisionable = Provisionable<
  LocalStateService, LocalStateResources, 'preparable'
>;

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
