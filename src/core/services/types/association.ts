import type { Dictionary } from 'lodash'
import type { Stack } from '@lib/stack'
import type { Obj } from '@lib/util'
import type { BaseServiceAttributes, ServiceTypeChoice } from './util'
import type { BaseProvisionable } from './provisionable'
import type { ProvisionResources } from './resources'

/**
 * @type {AssociationReturnType} the return types for association handlers
 */
export type AssociationReturnType = ProvisionResources | void

/**
 * @type {AssociationLookup} the function which determines whether an association takes effect
 */
export type AssociationLookup = (
  config: BaseServiceAttributes,
  linkedConfig: BaseServiceAttributes,
) => boolean

/**
 * @type {AssociationHandler} the handler to run when an association takes effect
 */
export type AssociationHandler<
  Ret extends AssociationReturnType,
  Prov extends BaseProvisionable = BaseProvisionable,
  Opts extends Obj = Obj,
> = (current: Prov, stack: Stack, linked: BaseProvisionable, opts?: Opts) => Ret

/**
 * @type {Association} describes an association between two services
 */
export type Association<Ret extends AssociationReturnType = AssociationReturnType> = {
  handler: AssociationHandler<Ret>
  where?: AssociationLookup
  with?: ServiceTypeChoice
  requirement?: boolean
  sideEffect?: boolean
}

/**
 * @type {AnyAssociationHandler} describes any association hhandler
 */
export type AnyAssociationHandler = AssociationHandler<AssociationReturnType>

/**
 * @type {ServiceRequirement} the configuration object for associating a service with another
 * @param {ProvisionResources} Ret the handler's return type
 * @param {ServiceTypeChoice} S the service type choice the association refers to (optional)
 */
export type ServiceRequirement<
  Ret extends AssociationReturnType,
  S extends ServiceTypeChoice = never,
> = Association<Ret> & { requirement: true; with?: S }

/**
 * @type {ServiceSideEffect} describes a generic association that is not a requirement
 */
export type ServiceSideEffect<Ret extends AssociationReturnType = ProvisionResources> =
  Association<Ret> & {
    where?: AssociationLookup
    sideEffect: true
  }

/**
 * @type {ServiceAssociations} the service's associations
 */
export type ServiceAssociations = Dictionary<Association<any>>
