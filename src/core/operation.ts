import { Registry } from '@core/registry'
import { hashObject } from '@lib/hash'
import { isEmpty, uniqBy } from 'lodash'
import { validate, validateEnvironment } from '@core/validation'
import { Stack } from '@core/stack'
import type {
  BaseServiceAttributes,
  BaseProvisionable,
  Provisions,
  ServiceEnvironment,
  AnyAssociationHandler,
  AssociationReturnType,
} from '@core/service'
import { JSON_SCHEMA_ROOT } from '@constants'

type ProvisionablesMap = Map<BaseProvisionable['id'], BaseProvisionable>

type AssociatedProvisionable = {
  name: string
  target: BaseProvisionable
  handler: AnyAssociationHandler
}

type AssociatedProvisionablesMapping = Map<BaseProvisionable['id'], AssociatedProvisionable[]>

/**
 * @param {BaseServiceAttributes} config the service's configuration
 * @returns {String} the id to use as a terraform resource identifier
 */
const getProvisionableResourceId = (config: BaseServiceAttributes): string =>
  `${config.name || config.type}-${config.provider}-${config.region || 'default'}`

/**
 * @param {BaseServiceAttributes} config the service's configuration
 * @returns {BaseProvisionable} the provisionable to use in operations
 */
export const getProvisionable = (config: BaseServiceAttributes): BaseProvisionable => ({
  id: hashObject(config),
  config,
  service: Registry.fromConfig(config),
  requirements: {},
  provisions: {},
  sideEffects: {},
  registered: false,
  resourceId: getProvisionableResourceId(config),
})

/**
 * @param {BaseProvisionable} provisionable the provisionable to check
 * @throws {Error} if a requirement is not satisfied
 */
export const assertRequirementsSatisfied = (provisionable: BaseProvisionable) => {
  const {
    service: { associations = {}, type },
    requirements,
  } = provisionable

  Object.entries(associations).forEach(([name, assoc]) => {
    if (assoc.requirement && !requirements[name]) {
      throw new Error(`Requirement ${name} for service ${type} is not satisfied`)
    }
  })
}

export class Operation {
  /**
   * @var {Stack} stack the stack to deploy
   * @readonly
   */
  readonly stack: Stack

  /**
   * @var {ProvisionablesMap} provisionables the list of provisionable services
   */
  readonly provisionables: ProvisionablesMap = new Map()

  /**
   * @var {ServiceEnvironment[]} #environment the environment variables required for the operation
   * @private
   */
  #environment: ServiceEnvironment[]

  /**
   * @var {AssociationHandlersMapping} requirements the provisionable id per requirement mapping
   */
  #requirements: AssociatedProvisionablesMapping = new Map()

  /**
   * @var {AssociationHandlersMapping} sideEffects the provisionable id per side-effects mapping
   */
  #sideEffects: AssociatedProvisionablesMapping = new Map()

  /**
   * @constructor
   * @param {BaseServiceAttributes[]} serviceConfigs the services to provision
   * @param {string} envName the name of the environment we're deploying
   */
  constructor(serviceConfigs: BaseServiceAttributes[], envName: string) {
    this.stack = new Stack(envName)

    // Get services validated and apply default values
    const services = validate(JSON_SCHEMA_ROOT, serviceConfigs, {
      useDefaults: true,
    })

    this.setupProvisionables(services)
  }

  /**
   * Processes an operation and returns the Terraform configuration as an object
   *
   * @returns {Object} the terraform configuration object
   */
  process(): object {
    validateEnvironment(this.environment())
    this.provisionables.forEach((provisionable) => this.register(provisionable))

    return this.stack.toObject()
  }

  /**
   * Returns the environment variables required by the services
   *
   * @returns {ServiceEnvironment[]} the environment variables
   */
  environment(): ServiceEnvironment[] {
    if (!this.#environment) {
      const envVariables = Array.from(this.provisionables.values())
        .map((p) => p.service.environment)
        .filter((e) => !isEmpty(e))
        .flat()

      this.#environment = uniqBy(envVariables, (e) => e.name)
    }

    return this.#environment
  }

  /**
   * @param {BaseServiceAttributes[]} services the services to set up as provisionables
   */
  protected setupProvisionables(services: BaseServiceAttributes[]) {
    services.forEach((config) => {
      const provisionable: BaseProvisionable = {
        id: hashObject(config),
        config,
        service: Registry.fromConfig(config),
        requirements: {},
        provisions: {},
        sideEffects: {},
        registered: false,
        resourceId: getProvisionableResourceId(config),
      }

      this.provisionables.set(provisionable.id, provisionable)
    })

    for (const provisionable of this.provisionables.values()) {
      const {
        config,
        service: { associations },
      } = provisionable
      for (const [associationName, association] of Object.entries(associations || {})) {
        const {
          where: isAssociated,
          handler: associationHandler,
          with: associatedServiceType,
          requirement: isRequirement,
        } = association

        for (const linked of this.provisionables.values()) {
          if (associatedServiceType && linked.service.type !== associatedServiceType) {
            continue
          }

          if (typeof isAssociated === 'function' && !isAssociated(config, linked.config)) {
            continue
          }

          const targetMap = isRequirement ? this.#requirements : this.#sideEffects
          const links = targetMap.get(provisionable.id) || []

          targetMap.set(provisionable.id, [
            ...links,
            {
              target: linked,
              name: associationName,
              handler: associationHandler,
            },
          ])
        }
      }
    }
  }

  /**
   * Registers a provisionable and its associations to the stack
   *
   * @param {BaseProvisionable} provisionable the provisionable to register
   */
  protected register(provisionable: BaseProvisionable): Provisions {
    // Item has already been provisioned, bail...
    if (provisionable.registered) {
      return provisionable.provisions
    }

    const {
      config,
      service,
      service: { handler: resourceHandler },
    } = provisionable

    // Validate the configuration
    validate(service.schemaId, config, {
      useDefaults: true,
    })

    // Provision & verify the requirements first
    Object.assign(provisionable, {
      requirements: this.registerAssociated(
        provisionable,
        this.#requirements.get(provisionable.id),
      ),
    })

    assertRequirementsSatisfied(provisionable)

    Object.assign(provisionable, {
      provisions: resourceHandler(provisionable, this.stack),
      registered: true,
    })

    // Now that the provisionable is registered into the stack, take care of the side-effetcs
    Object.assign(provisionable, {
      sideEffects: this.registerAssociated(provisionable, this.#sideEffects.get(provisionable.id)),
    })

    this.provisionables.set(provisionable.id, provisionable)

    return provisionable.provisions
  }

  /**
   * @param {BaseProvisionable} provisionable the source provisionable
   * @param {AssociatedProvisionable[]} links the linked provisionables
   * @returns {Object} the output
   */
  protected registerAssociated(
    provisionable: BaseProvisionable,
    links?: AssociatedProvisionable[],
  ): Record<string, AssociationReturnType> {
    if (!links) {
      return {}
    }

    const output = {}

    links.forEach((link) => {
      const { target, name, handler } = link
      const linkedProvisions = this.register(target)
      const out = handler(
        {
          ...target,
          provisions: linkedProvisions,
        },
        this.stack,
        provisionable,
      )

      if (output) {
        Object.assign(output, {
          [name]: out,
        })
      }
    })

    return output
  }
}
