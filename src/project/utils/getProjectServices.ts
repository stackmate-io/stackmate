import { DEFAULT_PROVIDER, DEFAULT_REGION } from '@src/project/constants'
import { cloneDeep, defaultsDeep, fromPairs, get } from 'lodash'
import { getValidData } from '@src/validation'
import { getProjectSchema } from '@src/project/utils/getProjectSchema'
import { DEFAULT_PROFILE_NAME, SERVICE_TYPE } from '@src/constants'
import { Registry, type ServiceConfiguration } from '@src/services/registry'
import type { ProviderChoice, ServiceTypeChoice } from '@src/services/types'
import type { ProjectConfiguration } from '@src/project/types'

const normalizeProject = (project: ProjectConfiguration): ProjectConfiguration => {
  const projectProvider = project.provider || DEFAULT_PROVIDER
  const projectRegion = project.region || DEFAULT_REGION[projectProvider]
  const cloned = cloneDeep(project)

  defaultsDeep(cloned, {
    provider: projectProvider,
    state: {
      type: SERVICE_TYPE.STATE,
      provider: projectProvider,
      name: 'project-state',
      region: projectRegion,
    },
    environments: {
      ...fromPairs(
        Object.entries(project.environments).map(([environment, services]) => [
          environment,
          fromPairs(
            Object.entries(services).map(([serviceName]) => [
              serviceName,
              {
                provider: projectProvider,
                region: projectRegion,
                name: serviceName,
                profile: DEFAULT_PROFILE_NAME,
                overrides: {},
              },
            ]),
          ),
        ]),
      ),
    },
  })

  return cloned
}

export const getProjectServices = (
  raw: ProjectConfiguration,
  environment: string,
): ServiceConfiguration[] => {
  const projectProvider = raw.provider || DEFAULT_PROVIDER
  const projectRegion = raw.region || DEFAULT_REGION[projectProvider]

  const project = getValidData(normalizeProject(raw), getProjectSchema(), {
    useDefaults: true,
  })

  const environmentServices = get(project, `environments.${environment}`, {})
  const services: ServiceConfiguration[] = [project.state]

  const providerServiceTypes: Map<ProviderChoice, ServiceTypeChoice[]> = new Map()
  const coreServicesPerRegion: Map<ProviderChoice, string> = new Map()

  for (const [name, config] of Object.entries(environmentServices)) {
    const { type, provider = projectProvider, region = projectRegion } = config
    const availableTypes = providerServiceTypes.get(provider) || Registry.types(provider)
    const hasCoreServicesForRegion = Boolean(coreServicesPerRegion.get(provider))

    if (!availableTypes.includes) {
      throw new Error(`Service type "${type}" is not available for the "${provider}" provider`)
    }

    // Add the provider and networking services (if available)
    if (!hasCoreServicesForRegion) {
      const coreServices = [SERVICE_TYPE.PROVIDER, SERVICE_TYPE.NETWORKING].filter((st) =>
        availableTypes.includes(st),
      )

      for (const type of coreServices) {
        services.push({
          name: `${provider}-${type}-service`,
          provider,
          region,
          type,
        } as ServiceConfiguration)
      }
    }

    services.push({
      ...config,
      name,
      provider,
      region,
    } as ServiceConfiguration)

    coreServicesPerRegion.set(provider, region)
  }

  return services
}
