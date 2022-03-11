import { clone, defaultsDeep, fromPairs, merge, omit } from 'lodash';

import { NormalizedProjectConfiguration, NormalizedStage, ProjectConfiguration, ProviderChoice, StageDeclarations } from '@stackmate/types';

/**
 * Normalizes the stages configuration
 *
 * @param {Object} stages the stages to normalize
 * @param {String} provider the project's default provider
 * @param {String} region the project's default string
 * @param {String} projectName the associated project's name
 * @returns {Object} the normalized stages
 */
export const normalizeStages = (
  stages: StageDeclarations, provider: ProviderChoice, region: string, projectName: string,
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
      const service = stage[name];

      // Apply the service's name
      Object.assign(service, { name, projectName, stageName });

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
 * Normalizes the project's configuration
 *
 * @param {Object} configuration the project configuration
 * @returns {Object}
 */
export const normalizeProject = (configuration: ProjectConfiguration): NormalizedProjectConfiguration => {
  const normalized = clone(configuration) as NormalizedProjectConfiguration;
  const { name: projectName, provider, region, stages, secrets, state, defaults = {} } = normalized;

  Object.assign(normalized, {
    stages: normalizeStages(stages, provider, region, projectName),
    secrets: defaultsDeep(secrets, { provider, region }),
    state: defaultsDeep(state, { provider, region }),
    defaults,
  });

  return normalized;
};
