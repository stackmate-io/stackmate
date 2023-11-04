import { isEmpty, uniqBy } from 'lodash'
import { Stack } from '@lib/stack'
import { getProvisionables } from '@core/provision'
import { validateEnvironment } from 'src/services/utils'
import type { ServiceConfiguration } from '@core/registry'
import type { AssociationReturnType, ServiceEnvironment, Provisions } from 'src/services/types'
import type { AssociatedProvisionable, AssociatedProvisionablesMap } from '@core/provision'
import type { ProvisionablesMap, BaseProvisionable } from '../services/types/provisionable'

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
  constructor(serviceConfigs: ServiceConfiguration[], envName: string) {
    this.stack = new Stack(envName)
    this.provisionables = getProvisionables(serviceConfigs)
    this.initialize()
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
   * Initializes the operation
   */
  protected initialize() {
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
      service: { type, handler: resourceHandler, associations = {} },
      requirements,
    } = provisionable

    // Provision & verify the requirements first
    Object.assign(provisionable, {
      requirements: this.registerAssociated(
        provisionable,
        this.#requirements.get(provisionable.id),
      ),
    })

    Object.entries(associations).forEach(([name, assoc]) => {
      if (assoc.requirement && !requirements[name]) {
        throw new Error(`Requirement ${name} for service ${type} is not satisfied`)
      }
    })

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
