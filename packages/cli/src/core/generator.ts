import fs from 'node:fs';
import path from 'node:path';

import ini from 'ini';
import { camelCase } from 'lodash';
import {
  AWS_REGIONS, DEFAULT_REGION, ProjectConfiguration, PROVIDER, StackmateProject,
  ServiceRegistry, SERVICE_TYPE, uniqueIdentifier, Project, CloudServiceAttributes,
  StateServiceConfiguration, VaultServiceConfiguration, CloudServiceConfiguration,
} from '@stackmate/engine';


import { CURRENT_DIRECTORY } from '@stackmate/cli/constants';
import { ProjectConfigCreationOptions } from '@stackmate/cli/types';

export const getRepository = (fileName = path.join(CURRENT_DIRECTORY, '.git', 'config')) => {
  if (!fs.existsSync(fileName)) {
    return;
  }

  const contents = fs.readFileSync(fileName);
  if (!contents) {
    return;
  }

  const config = ini.parse(contents.toString('utf-8'));
  console.log(config);
};

export const extractProjectNameFromRepository = () => {
};

export const createProject = ({
  projectName,
  defaultProvider = PROVIDER.AWS,
  stateProvider = PROVIDER.AWS,
  secretsProvider = PROVIDER.AWS,
  defaultRegion = AWS_REGIONS.EU_CENTRAL_1,
  stageNames = ['production'],
  serviceTypes = []}: ProjectConfigCreationOptions
): ProjectConfiguration => {
  const [stageName, ...otherStages] = stageNames;
  const provider = defaultProvider || PROVIDER.AWS;
  const region = defaultRegion || DEFAULT_REGION[provider];

  const state = ServiceRegistry.get(stateProvider || provider, SERVICE_TYPE.STATE).config({
    projectName, stageName,
  }) as StateServiceConfiguration;

  const vault = ServiceRegistry.get(secretsProvider || provider, SERVICE_TYPE.VAULT).config({
    projectName, stageName,
  }) as VaultServiceConfiguration;

  const config: ProjectConfiguration = {
    name: projectName,
    provider,
    region,
    state,
    secrets: vault,
    stages: [
      {
        name: stageName,
        services: serviceTypes.map((type) => {
          const config = ServiceRegistry.get(provider, type).config({
            projectName,
            stageName,
          });

          const ret = {
            ...config,
            type: type,
            name: camelCase(config.name || uniqueIdentifier(type, { stageName })),
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
    ],
  };

  // Validate the configuration
  Project.factory<StackmateProject.Type>(config);

  return config;
};
