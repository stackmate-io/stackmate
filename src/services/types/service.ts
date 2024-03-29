import type { JsonSchema } from '@lib/schema'
import type { Obj } from '@lib/util'
import type { ServiceAssociations } from './association'
import type { ProvisionHandler } from './provisionable'
import type {
  BaseServiceAttributes,
  ProviderChoice,
  ServiceTypeChoice,
  ServiceEnvironment,
} from './util'

/**
 * @type {Service} accepts a set of service attributes and returns a Service object
 * @param {BaseServiceAttributes}
 * @param {Associations}
 */
export type Service<
  Setup extends BaseServiceAttributes,
  Associations extends ServiceAssociations = Obj,
  Envs extends string[] = [],
> = {
  provider: ProviderChoice
  type: ServiceTypeChoice
  regions?: readonly string[]
  schemaId: string
  schema: JsonSchema<Setup>
  environment: ServiceEnvironment<Envs>
  handler: ProvisionHandler
  associations: Associations
}
/**
 * @type {BaseService} base service type
 */
export type BaseService = Service<BaseServiceAttributes>

/**
 * @type {ExtractAttrs} extracts arguments from a service
 */
export type ExtractAttrs<T> = T extends Service<infer Attrs> ? Attrs : never
