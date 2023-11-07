import { fromPairs } from 'lodash'
import { Stack } from '@lib/stack'
import { validateEnvironment } from '@services/utils'
import { Registry, type ServiceConfiguration, type ServiceAttributes } from '@services/registry'
import { getSchema, getValidData } from '@src/validation'
import type { Dictionary } from 'lodash'
import type {
  AssociationReturnType,
  Provisions,
  AssociatedProvisionable,
  AssociatedProvisionablesMap,
  ProvisionablesMap,
  BaseProvisionable,
} from '@services/types'

/**
 * @param {BaseProvisionable} provisionable the provisionable to check
 * @throws {Error} if a requirement is not satisfied
 */
const assertRequirementsSatisfied = (provisionable: BaseProvisionable) => {
  const {
    service: { associations, type },
    requirements,
  } = provisionable

  if (!associations) {
    return
  }

  Object.entries(associations).forEach(([name, assoc]) => {
    if (!assoc.requirement) {
      return
    }

    if (!requirements[name]) {
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
   * @var {Dictionary<string | undefined >} variables the variables to use
   */
  readonly #variables: Dictionary<string | undefined>

  /**
   * @var {ProvisionablesMap} provisionables the list of provisionable services
   */
  #provisionables: ProvisionablesMap = new Map()

  /**
   * @var {AssociationHandlersMapping} requirements the provisionable id per requirement mapping
   */
  #requirements: AssociatedProvisionablesMap = new Map()

  /**
   * @var {AssociationHandlersMapping} sideEffects the provisionable id per side-effects mapping
   */
  #sideEffects: AssociatedProvisionablesMap = new Map()

  /**
   * @constructor
   * @param {ServiceConfiguration[]} serviceConfigs the services to provision
   * @param {string} envName the name of the environment we're deploying
   */
  constructor(
    serviceConfigs: ServiceConfiguration[],
    envName: string,
    variables: Dictionary<string | undefined> = process.env,
  ) {
    this.#variables = variables
    this.stack = new Stack(envName, this.#variables)
    this.init(serviceConfigs)
  }

  /**
   * @returns {Map} the provisionables
   */
  get provisionables() {
    if (!this.#provisionables.size) {
      throw new Error('No provisionables found, have you ran the `init` method?')
    }

    return this.#provisionables
  }

  /**
   * Processes an operation and returns the Terraform configuration as an object
   *
   * @returns {Object} the terraform configuration object
   */
  process(): object {
    const allEnvs = Array.from(this.provisionables.values()).map((p) => p.service.environment)
    validateEnvironment(allEnvs, this.#variables)

    this.provisionables.forEach((provisionable) => this.register(provisionable))

    return this.stack.toObject()
  }

  /**
   * Initializes and validates the service configurations
   *
   * @param {ServiceConfiguration[]} configs
   */
  protected init(configs: ServiceConfiguration[]) {
    const serviceAttributes = getValidData<ServiceConfiguration[], ServiceAttributes[]>(
      configs,
      getSchema(),
    )

    this.#provisionables = new Map(
      serviceAttributes.map((attrs) => {
        const provisionable = Registry.provisionable(attrs)
        return [provisionable.id, provisionable]
      }),
    )

    this.associateProvisionables()
  }

  /**
   * Initializes the operation
   */
  protected associateProvisionables() {
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
      service: { handler: resourceHandler },
    } = provisionable

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
      environment: fromPairs(
        Object.keys(provisionable.service.environment).map((env) => [env, this.stack.local(env)]),
      ),
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
