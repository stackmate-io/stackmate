import fs from 'node:fs';
import path from 'node:path';
import ini from 'ini';
import { camelCase, isEmpty, omitBy } from 'lodash';

import {
  AWS_REGIONS, DEFAULT_REGION, ProjectConfiguration, Project, PROVIDER,
  ServiceRegistry, SERVICE_TYPE, uniqueIdentifier, CloudServiceAttributes,
  StateServiceConfiguration, VaultServiceConfiguration, CloudServiceConfiguration,
  StageConfiguration, BaseService, ConfigurationOptions,
} from '@stackmate/engine';

import { CURRENT_DIRECTORY } from '@stackmate/cli/constants';
import { ProjectConfigCreationOptions } from '@stackmate/cli/types';

export const getRepository = (fileName = path.join(CURRENT_DIRECTORY, '.git', 'config')): string | undefined => {
  if (!fs.existsSync(fileName)) {
    return;
  }

  const contents = fs.readFileSync(fileName);
  if (!contents) {
    return;
  }

  const config = ini.parse(contents.toString('utf-8'));
  if (!config || !config['remote "origin"']) {
    return;
  }

  const { ['remote "origin"']: { url } } = config;
  return url.replace(/^([^\:\/]+)[:\/]{1}(?<owner>[^\/]+)\/(?<repo>[^.]+)(\.git)?$/i, '$2/$3');
};

// Attributes that are implied in the service configuration and are
const rootImpliedAttributes = ['provider', 'region'];

const skipImpliedAttributes = (
  serviceConfig: object,
  rootConfig: Partial<ProjectConfiguration>,
) => (
  omitBy(serviceConfig, (value, key) => (
    rootImpliedAttributes.includes(key) && rootConfig[key as keyof typeof rootConfig] === value
  ))
);

export const createProject = ({
  projectName,
  defaultProvider = PROVIDER.AWS,
  stateProvider = PROVIDER.AWS,
  secretsProvider = PROVIDER.AWS,
  defaultRegion = AWS_REGIONS.EU_CENTRAL_1,
  stageNames = ['production'],
  serviceTypes = []}: ProjectConfigCreationOptions,
): ProjectConfiguration => {
  const validStageNames = stageNames.filter(st => Boolean(st));
  const validServiceTypes = serviceTypes.filter(st => Boolean(st));

  if (isEmpty(validStageNames)) {
    throw new Error('You need to provide the names for the project’s stages');
  }

  if (isEmpty(validServiceTypes)) {
    throw new Error('You need to provide at least one service to be deployed');
  }

  const [stageName, ...otherStages] = validStageNames;
  const provider = defaultProvider || PROVIDER.AWS;
  const region = defaultRegion || DEFAULT_REGION[provider];

  const stateConfig = ServiceRegistry.get(stateProvider || provider, SERVICE_TYPE.STATE).config({
    projectName, stageName,
  }) as StateServiceConfiguration;

  const vaultConfig = ServiceRegistry.get(secretsProvider || provider, SERVICE_TYPE.VAULT).config({
    projectName, stageName,
  }) as VaultServiceConfiguration;

  const rootConfig: Omit<ProjectConfiguration, 'stages'> = {
    name: projectName,
    provider,
    region,
  };

  const secrets = skipImpliedAttributes(vaultConfig, rootConfig);
  const state = skipImpliedAttributes(stateConfig, rootConfig);

  const stages: StageConfiguration[] = [
    {
      name: stageName,
      services: validServiceTypes.map((type) => {
        const baseConfig = ServiceRegistry.get(provider, type).config({
          projectName,
          stageName,
        });

        const config: ConfigurationOptions<BaseService.Attributes> = skipImpliedAttributes(
          baseConfig, rootConfig,
        );

        const ret = {
          ...config,
          type: type,
          name: camelCase(uniqueIdentifier(type, { stageName })),
        };

        return ret as CloudServiceConfiguration<CloudServiceAttributes>;
      }),
    },
    ...otherStages.map(
      (stg: string) => ({
        name: stg,
        copy: stageName,
      }),
    ),
  ];

  const config: ProjectConfiguration = {
    ...rootConfig,
    ...(!isEmpty(secrets) ? { secrets } : {}),
    ...(!isEmpty(state) ? { state } : {}),
    stages,
  };

  // Validate the configuration
  Project.validate(config, { useDefaults: false });

  return config;
};
