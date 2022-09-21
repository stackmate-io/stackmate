import fs from 'node:fs';
import path from 'node:path';
import ini from 'ini';
import { countBy, isEmpty, omitBy, uniq } from 'lodash';

import {
  SERVICE_TYPE, PROVIDER, AWS_DEFAULT_REGION, Project,
  BaseServiceAttributes, ServiceTypeChoice, DEFAULT_REGIONS, Registry, ProjectConfiguration, validateProject,
} from '@stackmate/engine';

import { CURRENT_DIRECTORY } from '@stackmate/cli/constants';
import { ProjectConfigCreationOptions } from '@stackmate/cli/types';
import { StageConfiguration } from '@stackmate/engine/core/project';

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

const skipImpliedAttributes = <T extends BaseServiceAttributes>(
  serviceConfig: Partial<T>,
  rootConfig: Partial<Project>,
): T => (
  omitBy(serviceConfig, (value, key) => (
    rootImpliedAttributes.includes(key) && rootConfig[key as keyof typeof rootConfig] === value
  )) as T
);

export const createProject = ({
  projectName,
  defaultProvider = PROVIDER.AWS,
  stateProvider = PROVIDER.AWS,
  secretsProvider = PROVIDER.AWS,
  defaultRegion = AWS_DEFAULT_REGION,
  stageNames = ['production'],
  serviceTypes = []}: ProjectConfigCreationOptions,
): ProjectConfiguration => {
  const validServiceTypes = serviceTypes.filter(st => Object.values(SERVICE_TYPE).includes(st));
  const validStageNames = uniq(stageNames.filter(st => Boolean(st)));
  const serviceTypeCounts = countBy(validServiceTypes, String);
  const addedServiceTypes: Map<ServiceTypeChoice, number> = new Map();

  if (isEmpty(validStageNames)) {
    throw new Error('You need to provide the names for the project’s stages');
  }

  if (isEmpty(validServiceTypes)) {
    throw new Error('You need to provide at least one service to be deployed');
  }

  const [stageName, ...otherStages] = validStageNames;
  const provider = defaultProvider || PROVIDER.AWS;
  const region: string = defaultRegion || DEFAULT_REGIONS[provider];

  const stateConfig = Registry.get(stateProvider || provider, SERVICE_TYPE.STATE).config();
  const vaultConfig = Registry.get(secretsProvider || provider, SERVICE_TYPE.SECRETS).config();

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
        const baseConfig = Registry.get(provider, type).config({
          projectName,
          stageName,
        });

        const config = skipImpliedAttributes(baseConfig, rootConfig);

        let name = config.name;

        if (serviceTypeCounts[type] > 1) {
          const count = (addedServiceTypes.get(type) || 0) + 1;
          addedServiceTypes.set(type, count);
          name = `${name}-${count}`;
        }

        return { ...config, name, type };
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
  validateProject(config, { useDefaults: false });

  return config;
};
