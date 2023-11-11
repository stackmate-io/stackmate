import pipe from 'lodash/fp/pipe'
import { PROVIDER } from '@src/constants'
import { REGIONS } from '@aws/constants'
import { getBaseService } from '@services/utils'
import { withAssociations, withRegions } from '@services/behaviors'
import type { ServiceTypeChoice } from '@services/types'
import { getProviderAssociations } from './getProviderAssociations'
import { getNetworkingAssociations } from './getNetworkingAssociations'

export const getAwsService = (type: ServiceTypeChoice) =>
  pipe(
    withAssociations({
      ...getProviderAssociations(),
      ...getNetworkingAssociations(),
    }),
    withRegions(REGIONS),
  )(getBaseService(PROVIDER.AWS, type))
