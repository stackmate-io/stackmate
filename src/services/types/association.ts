import type { Dictionary } from 'lodash'
import type { Stack } from '@lib/stack'
import type { Obj } from '@lib/util'
import type { BaseServiceAttributes, ServiceTypeChoice } from './util'
import type { BaseProvisionable } from './provisionable'
import type { ProvisionResources } from './resources'

export type AssociationReturnType = ProvisionResources | void

export type AssociationLookup = (
  config: BaseServiceAttributes,
  linkedConfig: BaseServiceAttributes,
) => boolean

export type AttributesImporter = (config: BaseServiceAttributes) => BaseServiceAttributes

export type AssociationHandler<
  Ret extends AssociationReturnType,
  Prov extends BaseProvisionable = BaseProvisionable,
  Opts extends Obj = Obj,
> = (current: Prov, stack: Stack, linked: BaseProvisionable, opts?: Opts) => Ret

export type Association<Ret extends AssociationReturnType = AssociationReturnType> = {
  handler: AssociationHandler<Ret>
  imports?: AttributesImporter
  where?: AssociationLookup
  with?: ServiceTypeChoice
  requirement?: boolean
  sideEffect?: boolean
}

export type AnyAssociationHandler = AssociationHandler<AssociationReturnType>

export type ServiceRequirement<
  Ret extends AssociationReturnType,
  S extends ServiceTypeChoice = never,
> = Association<Ret> & { requirement: true; with?: S }

export type ServiceSideEffect<Ret extends AssociationReturnType = ProvisionResources> =
  Association<Ret> & {
    where?: AssociationLookup
    sideEffect: true
  }

export type ServiceAssociations = Dictionary<Association<any>>
