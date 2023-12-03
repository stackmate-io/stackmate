import type { PROVIDER, SERVICE_TYPE } from '@src/constants'
import type { BaseServiceAttributes } from '@src/services/types'

type TasksBreakdown = {
  tasks: {
    deployment: string[]
  }
}

type AppAttributes = BaseServiceAttributes & {
  provider: typeof PROVIDER.AWS
  type: typeof SERVICE_TYPE.APP
  environment?: Record<string, string>
}
