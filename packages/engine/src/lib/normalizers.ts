import { clone, defaultsDeep, fromPairs, merge, omit } from 'lodash';

import { NormalizedProjectConfiguration, NormalizedStage, ProjectConfiguration, ProviderChoice, StageDeclarations } from '@stackmate/types';
import { VAULT_PROVIDER } from '@stackmate/constants';

/**
 * Normalizes the stages configuration
 *
 * @param stages {Object} the stages to normalize
 * @param provider {String} the project's default provider
 * @param region {String} the project's default string
 * @returns {Object} the normalized stages
 */
export const normalizeStages = (
  stages: StageDeclarations, provider: ProviderChoice, region: string,
): { [name: string]: NormalizedStage } => {
  const getSourceDeclaration = (source: string): object => {
    const stg = stages[source];
    return stg.from ? getSourceDeclaration(stg.from) : stg;
  };

  const normalizedStages = Object.keys(stages || []).map((stageName) => {
    const {
      from: copiedStageName = null,
      skip: skippedServices = [],
      ...declaration
    } = stages[stageName];

    let stage = clone(declaration);

    // Copy the full attributes to stages that copy each other
    if (copiedStageName) {
      const source = clone(
        // Omit any services that the copied stage doesn't need
        omit(getSourceDeclaration(copiedStageName), ...skippedServices),
      );

      stage = merge(omit(source, 'from', 'skip'), declaration);
    }

    Object.keys(stage).forEach((name) => {
      const service = stage[name]!;

      // Apply the service's name
      Object.assign(service, { name });

      // Apply the service's provider (if not any)
      if (!service.provider) {
        Object.assign(service, { provider });
      }

      // Apply the service's region (if not any)
      if (!service.region) {
        Object.assign(service, { region });
      }
    });

    return [stageName, stage];
  });

  return fromPairs(normalizedStages);
};

/**
 * Normalizes the secrets attributes
 *
 * @param {String} region the default region for the project
 * @param {String} provider the project's provider
 */
export const normalizeSecrets = (secrets: object, region: string) => {
  return defaultsDeep(secrets, { region, provider: VAULT_PROVIDER.AWS });
};

/**
 * Normalizes the project's configuration
 *
 * @param {Object} configuration the project configuration
 * @returns {Object}
 */
export const normalizeProject = (configuration: ProjectConfiguration): NormalizedProjectConfiguration => {
  const normalized = clone(configuration) as NormalizedProjectConfiguration;
  const { provider, region, stages, secrets, defaults = {} } = normalized;

  Object.assign(normalized, {
    stages: normalizeStages(stages, provider, region),
    secrets: normalizeSecrets(secrets, region),
    defaults,
  });

  return normalized;
};
