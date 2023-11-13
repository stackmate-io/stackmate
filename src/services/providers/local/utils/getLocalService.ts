import pipe from 'lodash/fp/pipe'
import { PROVIDER } from '@src/constants'
import { withAssociations } from '@services/behaviors'
import { getBaseService } from '@services/utils'
import type { ServiceTypeChoice } from '@services/types'

export const getLocalService = (type: ServiceTypeChoice) =>
  pipe(withAssociations(associations))(getBaseService(PROVIDER.LOCAL, type))
