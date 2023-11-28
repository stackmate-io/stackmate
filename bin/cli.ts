#!/usr/bin/env node
import { Command } from 'commander'

const program = new Command()

program.description('Stackmate CLI - See https://stackmate.io')
program.version('0.0.1')

async function main() {
  await program.parseAsync()
}

main()
