#!/usr/bin/env node
import yargs from 'yargs'
import { getOperationalCommand } from './utils/getOperationalCommand'

const usage = `Example usage:
$0 deploy <environment> [options]
$0 destroy <environment> [options]
$0 preview <environment> [options]`

export const cli = yargs
  .scriptName('stackname')
  .command(getOperationalCommand('deploy'))
  .command(getOperationalCommand('destroy'))
  .command(getOperationalCommand('preview'))
  .usage(usage)
  .demandCommand(1, 'You need to provide a command to run, see usage by adding --help')
  .showHelpOnFail(false)

yargs.argv
