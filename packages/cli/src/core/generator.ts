import fs from 'node:fs';
import path from 'node:path';
import ini from 'ini';
import { countBy, isEmpty, omitBy, uniq } from 'lodash';

import {
  SERVICE_TYPE, PROVIDER, AWS_DEFAULT_REGION, Project,
  BaseServiceAttributes, ServiceTypeChoice, DEFAULT_REGIONS, StageConfiguration,
  Registry, ProjectConfiguration, validateProject, CloudServiceAttributes,
  BaseService, ProviderChoice, isCoreService, CloudService, JsonSchema, CloudProviderChoice,
} from '@stackmate/engine';

import { CURRENT_DIRECTORY } from '@stackmate/cli/constants';

type TemplatePlaceholders = {
  projectName: string;
  stageName?: string;
  provider: ProviderChoice;
  type: ServiceTypeChoice;
}

type ProjectConfigCreationOptions = {
  projectName: string,
  defaultProvider?: CloudProviderChoice,
  defaultRegion?: string,
  stageNames?: string[],
  stateProvider?: CloudProviderChoice,
  secretsProvider?: CloudProviderChoice,
  serviceTypes?: ServiceTypeChoice[],
};

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
const ROOT_IMPLIED_ATTRIBUTES = ['provider', 'region'];

export const applyServiceTemplate = (
  template: string, placeholders: TemplatePlaceholders,
): string => {
  let result = template;

  for (const [key, value] of Object.entries(placeholders)) {
    result.replace(new RegExp(`\\$\\{${key}\\}`, 'ig'), value);
  }

  return result;
};

export const skipImpliedAttributes = <T extends BaseServiceAttributes>(
  serviceConfig: Partial<T>,
  rootConfig: Partial<Project>,
): T => (
  omitBy(serviceConfig, (value, key) => (
    ROOT_IMPLIED_ATTRIBUTES.includes(key) && rootConfig[key as keyof typeof rootConfig] === value
  )) as T
);

export const getServiceConfiguration = (
  service: BaseService,
  opts: Pick<TemplatePlaceholders, 'projectName' | 'stageName'>,
): Partial<BaseServiceAttributes> => {
  const { type, provider, schema: { properties = {} } } = service;

  if (isEmpty(properties)) {
    return {};
  }

  const placeholders: TemplatePlaceholders = { ...opts, type, provider };
  const config: Partial<BaseServiceAttributes> = {};
  for (const [key, schema] of Object.entries(properties)) {
    const {
      default: defaultValue,
      isIncludedInConfigGeneration,
      serviceConfigGenerationTemplate,
    } = schema as JsonSchema;

    if (!isIncludedInConfigGeneration) {
      continue;
    }

    if (serviceConfigGenerationTemplate) {
      Object.assign(config, {
        [key]: applyServiceTemplate(serviceConfigGenerationTemplate, placeholders),
      });
    } else if (defaultValue) {
      Object.assign(config, {
        [key]: defaultValue,
      });
    } else {
      throw new Error(
        `There is no template or default value for property ${key} for service ${service.schemaId} ${JSON.stringify(schema)}`,
      );
    }
  }

  return config;
};

export const createProject = ({
  projectName,
  defaultProvider = PROVIDER.AWS,
  stateProvider = PROVIDER.AWS,
  secretsProvider = PROVIDER.AWS,
  defaultRegion = AWS_DEFAULT_REGION,
  stageNames = ['production'],
  serviceTypes = []}: ProjectConfigCreationOptions,
): ProjectConfiguration => {
  const validServiceTypes = serviceTypes.filter(
    st => Object.values(SERVICE_TYPE).includes(st) && !isCoreService(st),
  );
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

  const stateConfig = getServiceConfiguration(
    Registry.get(stateProvider || provider, SERVICE_TYPE.STATE), { projectName },
  );

  const vaultConfig = getServiceConfiguration(
    Registry.get(secretsProvider || provider, SERVICE_TYPE.SECRETS), { projectName },
  );

  const rootConfig: Omit<ProjectConfiguration, 'stages'> = {
    name: projectName,
    provider,
    region,
  };

  const secrets = skipImpliedAttributes(vaultConfig, rootConfig);
  const state = skipImpliedAttributes(stateConfig, rootConfig);

  const stages: StageConfiguration<true>[] = [
    {
      name: stageName,
      services: validServiceTypes.map((type) => {
        const srv = Registry.get(provider, type) as CloudService;

        const config = skipImpliedAttributes(
          getServiceConfiguration(srv, { projectName, stageName }), rootConfig,
        ) as Partial<CloudServiceAttributes>;

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
