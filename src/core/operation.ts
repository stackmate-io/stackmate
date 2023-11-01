import { Registry } from '@core/registry'
import { hashObject } from '@lib/hash'
import { isEmpty, uniqBy } from 'lodash'
import { validate, validateEnvironment } from '@core/validation'
import { assertRequirementsSatisfied } from '@core/service'
import type { Stack } from '@core/stack'
import type {
  BaseServiceAttributes,
  BaseProvisionable,
  Provisions,
  ServiceEnvironment,
  ServiceScopeChoice,
  AnyAssociationHandler,
  AssociationReturnType,
} from '@core/service'

type ProvisionablesMap = Map<BaseProvisionable['id'], BaseProvisionable>

type AssociatedProvisionable = {
  name: string
  target: BaseProvisionable
  handler: AnyAssociationHandler
}

type AssociatedProvisionablesMapping = Map<BaseProvisionable['id'], AssociatedProvisionable[]>

export type OperationType = 'deployment' | 'destruction' | 'setup'

export const OPERATION_TYPE: Record<string, OperationType> = {
  DEPLOYMENT: 'deployment',
  DESTRUCTION: 'destruction',
  SETUP: 'setup',
} as const

/**
 * @param {BaseServiceAttributes} config the service's configuration
 * @param {String} stageName the stage's name
 * @returns {String} the id to use as a terraform resource identifier
 */
const getProvisionableResourceId = (config: BaseServiceAttributes): string =>
  `${config.name || config.type}-${config.provider}-${config.region || 'default'}`

/**
 * @param {BaseServiceAttributes} config the service's configuration
 * @returns {BaseProvisionable} the provisionable to use in operations
 */
export const getProvisionable = (config: BaseServiceAttributes): BaseProvisionable => {
  const service = Registry.fromConfig(config)

  return {
    id: hashObject(config),
    config,
    service,
    requirements: {},
    provisions: {},
    sideEffects: {},
    registered: false,
    resourceId: getProvisionableResourceId(config),
  }
}

export class Operation {
  /**
   * @var {Stack} stack the stack to deploy
   * @readonly
   */
  readonly stack: Stack

  /**
   * @var {ServiceScopeChoice} scope the services scope
   * @readonly
   */
  readonly scope: ServiceScopeChoice

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
   * @param {BaseServiceAttributes[]} services the services to provision
   * @param {Stack} stack the stage's stack
   * @param {ServiceScopeChoice} scope the services provisionable scope
   */
  constructor(
    services: BaseServiceAttributes[],
    stack: Stack,
    scope: ServiceScopeChoice = 'deployable',
  ) {
    this.stack = stack
    this.scope = scope
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
      const provisionable = getProvisionable(config)
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
