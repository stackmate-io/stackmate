import type { Stack } from '@lib/stack'
import type { BaseService } from '@core/service/core'
import type { Dictionary } from 'lodash'
import type { BaseServiceAttributes } from './base'
import type { Provisions, ProvisionResources } from './resources'

/**
 * @type {BaseProvisionable} base provisionable
 */
export type BaseProvisionable<Attrs extends BaseServiceAttributes = BaseServiceAttributes> = {
  id: string
  service: BaseService
  config: Attrs
  provisions: Provisions
  resourceId: string
  registered: boolean
  sideEffects: Provisions
  requirements: Dictionary<ProvisionResources>
}

/**
 * @type {ProvisionHandler} a function that can be used to deploy, prepare or destroy a service
 */

export type ProvisionHandler = (
  provisionable: BaseProvisionable,
  stack: Stack,
  opts?: object,
) => Provisions

export type ProvisionablesMap = Map<BaseProvisionable['id'], BaseProvisionable>
