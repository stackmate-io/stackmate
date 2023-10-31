import type { JsonSchema } from '@core/schema'
import type { BaseServiceAttributes } from './core'
import { withSchema } from './core'

type ConfigHintKeys = 'isIncludedInConfigGeneration' | 'serviceConfigGenerationTemplate'
type ConfigHintSchema = Record<string, Partial<Pick<JsonSchema, ConfigHintKeys>>>

export const withConfigHints = <C extends BaseServiceAttributes>(hints: ConfigHintSchema = {}) =>
  withSchema<C>({
    type: 'object',
    properties: {
      ...hints,
    },
  })
