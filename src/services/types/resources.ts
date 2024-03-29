import type { TerraformElement, TerraformLocal, TerraformOutput } from 'cdktf'
import type { Dictionary } from 'lodash'

export type ProvisionResources =
  | TerraformElement
  | TerraformElement[]
  | Dictionary<TerraformElement>
  | TerraformOutput
  | TerraformOutput[]
  | Dictionary<TerraformOutput>
  | Dictionary<TerraformOutput[]>

export type Provisions = Record<string, ProvisionResources> & {
  // The service's IP address to allow linking with services with
  ip?: TerraformLocal
  // The service's outputs
  outputs?: TerraformOutput[]
  // A resource reference such as a resource's ID to link with services within the same provider
  resourceRef?: TerraformLocal
}
