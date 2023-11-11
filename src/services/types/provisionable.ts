import type { TerraformLocal } from 'cdktf'
import type { Dictionary } from 'lodash'
import type { Obj } from '@lib/util'
import type { Stack } from '@lib/stack'
import type { BaseService, ExtractAttrs } from './service'
import type { BaseServiceAttributes } from './util'
import type { Provisions, ProvisionResources } from './resources'
import type { AnyAssociationHandler, Association, ServiceAssociations } from './association'

type ExtractServiceRequirements<Associations extends ServiceAssociations> = {
  [K in keyof Associations]: Associations[K] extends infer A extends Association<any>
    ? A['requirement'] extends true
      ? ReturnType<A['handler']>
      : never
    : never
}

export type BaseProvisionable<Attrs extends BaseServiceAttributes = BaseServiceAttributes> = {
  id: string
  service: BaseService
  config: Attrs
  provisions: Provisions
  resourceId: string
  registered: boolean
  sideEffects: Provisions
  requirements: Dictionary<ProvisionResources>
  variables: { [K: string]: TerraformLocal }
}

export type ProvisionHandler = (
  provisionable: BaseProvisionable,
  stack: Stack,
  opts?: object,
) => Provisions

export type Provisionable<
  Srv extends BaseService,
  Provs extends Provisions,
  Context extends Obj = Obj,
  Attrs extends BaseServiceAttributes = ExtractAttrs<Srv>,
> = BaseProvisionable<Attrs> & {
  service: Srv
  config: Attrs
  provisions: Provs
  context: Context
  requirements: ExtractServiceRequirements<Srv['associations']>
  variables: { [K in keyof Srv['environment']]: TerraformLocal }
}

export type AssociatedProvisionable = {
  name: string
  target: BaseProvisionable
  handler: AnyAssociationHandler
}
