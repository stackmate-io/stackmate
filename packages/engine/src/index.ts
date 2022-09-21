import { validateProject as projectValidationGenerator } from '@stackmate/engine/core/validation';

export * as util from '@stackmate/engine/lib/util';
export { DEFAULT_REGIONS } from '@stackmate/engine/providers';
export { Project, ProjectConfiguration } from '@stackmate/engine/core/project';
export { default as Registry, ServicesRegistry } from '@stackmate/engine/core/registry';
export { Operation, deployment, destruction, setup } from '@stackmate/engine/core/operation';
export { SERVICE_TYPE, PROVIDER, CLOUD_PROVIDER } from '@stackmate/engine/constants';
export { REGIONS as AWS_REGIONS, DEFAULT_REGION as AWS_DEFAULT_REGION } from '@stackmate/engine/providers/aws/constants';
export { BaseService, BaseServiceAttributes, ServiceTypeChoice, ProviderChoice } from '@stackmate/engine/core/service';

export const validateProject = projectValidationGenerator();
