import { merge } from 'lodash'
import type {
  BaseService,
  BaseServiceAttributes,
  Service,
  ServiceAssociations,
} from '@services/types'

/**
 * @type {WithAssociations} returns a service with additional associations
 */

export type WithAssociations<T extends BaseService, A extends ServiceAssociations> = T & {
  associations: A
}

/**
 * Associates two services.
 * For example:
 *  const AwsRdsService = compose(
 *    ...
 *    withAssociations({
 *      associationName: {
 *        with: SERVICE_TYPE.PROVIDER,
 *        where: (cfg, providerCfg) => cfg.region === providerCfg.region && ....,
 *        handler: (p, stack) => p.provisions.find(p => p instanceof KmsKey),
 *      },
 *      // ...
 *    }),
 *  )
 *
 * Which associate the current service (in our example AwsRdsService) with the "Provider" Service
 * under the alias `kmsKey`, when the criteria returned by `where` match,
 * using the `handler` function. The `handler` function returns the data to be used
 * as `requirements` when provisioning the service.
 *
 * @param {ServiceAssociations} associations the association configurations
 * @returns {Function<Service>}
 */
export const withAssociations =
  <C extends BaseServiceAttributes, A extends ServiceAssociations>(associations: A) =>
  <T extends Service<C>>(service: T): WithAssociations<T, A> => ({
    ...service,
    associations: merge({}, service.associations, associations),
  })
