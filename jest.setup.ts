import { Testing } from 'cdktf'
import { setupJest as setupCustomMatchers } from '@tests/helpers/validationErrorMatcher'

Testing.setupJest()
setupCustomMatchers()
