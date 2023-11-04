import { mergeSchemas } from '@lib/schema'
import type { JsonSchema } from '@lib/schema'
import type { Obj } from '@lib/util'
import type { BaseServiceAttributes, Service } from 'src/services/types'

/**
 * Adds schema modifications to a service (eg. when adding a new attribute)
 *
 * @param {JsonSchema} mods the schema modifications to apply
 * @returns {Function<Service>}
 */
export const withSchema =
  <C extends BaseServiceAttributes, Additions extends Obj = Obj>(mods: JsonSchema<Additions>) =>
  <T extends Service<C>>(srv: T): T & { schema: JsonSchema<Additions> } => ({
    ...srv,
    schema: mergeSchemas(srv.schema, mods),
  })
