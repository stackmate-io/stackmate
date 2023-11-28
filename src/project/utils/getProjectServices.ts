import { DEFAULT_PROVIDER, DEFAULT_REGION } from '@src/project/constants'
import { get, merge } from 'lodash'
import { getValidData } from '@src/validation'
import { getProjectSchema } from '@src/project/utils/getProjectSchema'
import { SERVICE_TYPE } from '@src/constants'
import { Registry, type ServiceConfiguration } from '@src/services/registry'
import type { ProviderChoice, ServiceTypeChoice } from '@src/services/types'
import type { ProjectConfiguration } from '@src/project/types'

export const getProjectServices = (
  project: ProjectConfiguration,
  environment: string,
): ServiceConfiguration[] => {
  const defaultProvider = project.provider || DEFAULT_PROVIDER
  const defaultRegion = project.region || DEFAULT_REGION[defaultProvider]

  const validProjectData = getValidData(project, getProjectSchema(), { useDefaults: true })
  const environmentServices = get(validProjectData, `environments.${environment}`, {})

  const services: ServiceConfiguration[] = [
    // State service is required
    merge({}, validProjectData.state, {
      type: SERVICE_TYPE.STATE,
      provider: validProjectData.state.provider || defaultProvider,
    }),
  ]

  const providerServiceTypes: Map<ProviderChoice, ServiceTypeChoice[]> = new Map()
  const providerEnabledRegions: Map<ProviderChoice, string> = new Map()

  for (const [name, config] of Object.entries(environmentServices)) {
    const { type, provider = defaultProvider, region = defaultRegion } = config
    const availableTypes = providerServiceTypes.get(provider) || Registry.types(provider)
    const hasProviderForRegion = Boolean(providerEnabledRegions.get(provider))

    if (hasProviderForRegion) {
      continue
    }

    if (!availableTypes.includes) {
      throw new Error(`Service type "${type}" is not available for the "${provider}" provider`)
    }

    // Add the provider and networking services (if available)
    const baseServices = [SERVICE_TYPE.PROVIDER, SERVICE_TYPE.NETWORKING]
      .filter((st) => availableTypes.includes(st))
      .map((type) => ({
        name: `${provider}-${type}-service`,
        provider,
        region,
      })) as ServiceConfiguration[]

    services.push(...baseServices, {
      ...config,
      name,
      provider,
      region,
    } as ServiceConfiguration)

    providerEnabledRegions.set(provider, region)
  }

  return services
}
