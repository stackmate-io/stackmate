import type { ProjectUpdate } from '@cdktf/cli-core'
import type { LogMessage } from '@cdktf/cli-core/src/lib/cdktf-project'

export const handleTerraformOutput = (log: ProjectUpdate | LogMessage) => {
  if (!('message' in log) || !log.message) {
    return
  }

  const lines = log.message.split('\r\n').map((line) => line.trim())
  for (const line of lines) {
    // eslint-disable-next-line no-console
    const logFunction = line.match(/^error\W/i) ? console.error : console.log
    logFunction(line)
  }
}
