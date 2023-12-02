import { DEFAULT_PROVIDER, DEFAULT_REGION } from '@src/project/constants'
import { cloneDeep, defaultsDeep, get, isEmpty } from 'lodash'
import { getValidData } from '@src/validation'
import { getProjectSchema } from '@src/project/utils/getProjectSchema'
import { SERVICE_TYPE, isDebugMode } from '@src/constants'
import { Registry, type ServiceConfiguration } from '@src/services/registry'
import type { EnvironmentChoice, ProjectConfiguration } from '@src/project/types'

export const getProjectServices = (
  raw: ProjectConfiguration,
  environment: EnvironmentChoice,
): ServiceConfiguration[] => {
  const project = getValidData(raw, getProjectSchema(), {
    useDefaults: true,
  })

  const projectProvider = project.provider || DEFAULT_PROVIDER
  const projectRegion = project.region || DEFAULT_REGION[projectProvider]
  const environmentConfig = get(project, `environments.${environment}`, {})

  if (isEmpty(environmentConfig)) {
    throw new Error(
      `There are no services registered for the "${environment}" environment, or it does not exist in the configuration`,
    )
  }

  // Normalize project services
  const serviceConfigurations = Object.entries(environmentConfig).map(([serviceName, config]) => ({
    ...config,
    name: serviceName,
    provider: config.provider || projectProvider,
    region: config.region || projectRegion,
  }))

  // Populate the service list, starting with the state service (which is required)
  const services: ServiceConfiguration[] = [
    defaultsDeep(cloneDeep(project.state), {
      type: SERVICE_TYPE.STATE,
      provider: projectProvider,
      name: 'project-state',
      region: projectRegion,
    }),
  ]

  // Register services that are not listed in the project configuration
  // but are associated with the listed ones
  for (const serviceConfig of serviceConfigurations) {
    const service = Registry.get(serviceConfig.provider || projectProvider, serviceConfig.type)

    Object.values(service.associations).forEach((association) => {
      const { with: requiredServiceType, where: isAssociated } = association

      // The association does not refer to a specific service type,
      // it's too generic and we don't know what service to register
      if (!requiredServiceType) {
        return
      }

      // if the service associated is already added to the list of services, there's nothing to do
      if (
        services.some(
          (srv) => srv.type === requiredServiceType && srv.region === serviceConfig.region,
        )
      ) {
        return
      }

      // If the associated service exists in the config, the service will be registered anyway
      if (
        serviceConfigurations.some(
          (link) => link.type === requiredServiceType && isAssociated(serviceConfig, link),
        )
      ) {
        return
      }

      const requiredServiceProvider = serviceConfig.provider || projectProvider
      const requiredServiceName = `${requiredServiceProvider}-${requiredServiceType}-service`

      services.push({
        name: requiredServiceName,
        provider: requiredServiceProvider,
        type: requiredServiceType,
        region: serviceConfig.region,
      })
    })

    services.push(serviceConfig as ServiceConfiguration)

    if (isDebugMode) {
      console.debug('full list of services:') // eslint-disable-line no-console
      console.debug(services) // eslint-disable-line no-console
    }
  }

  return services
}
