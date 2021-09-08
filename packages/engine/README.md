stackmate
=========



[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/stackmate.svg)](https://npmjs.org/package/stackmate)
[![Downloads/week](https://img.shields.io/npm/dw/stackmate.svg)](https://npmjs.org/package/stackmate)
[![License](https://img.shields.io/npm/l/stackmate.svg)](https://github.com/falexandrou/stackmate-ce/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g stackmate
$ stackmate COMMAND
running command...
$ stackmate (-v|--version|version)
stackmate/0.1.0 darwin-x64 node-v16.4.0
$ stackmate --help [COMMAND]
USAGE
  $ stackmate COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`stackmate deploy [ENVIRONMENT]`](#stackmate-deploy-environment)
* [`stackmate help [COMMAND]`](#stackmate-help-command)
* [`stackmate init [FILENAME]`](#stackmate-init-filename)

## `stackmate deploy [ENVIRONMENT]`

imports a docker-compose file and initializes a project based on that

```
USAGE
  $ stackmate deploy [ENVIRONMENT]

ARGUMENTS
  ENVIRONMENT  [default: production] the environment to deploy

OPTIONS
  -a, --application
  -i, --infrastructure
```

_See code: [src/commands/deploy.ts](https://github.com/falexandrou/stackmate-ce/blob/v0.1.0/src/commands/deploy.ts)_

## `stackmate help [COMMAND]`

display help for stackmate

```
USAGE
  $ stackmate help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.2/src/commands/help.ts)_

## `stackmate init [FILENAME]`

imports a docker-compose file and initializes a project based on that

```
USAGE
  $ stackmate init [FILENAME]

ARGUMENTS
  FILENAME  [default: docker-compose.yml] docker compose file to import
```

_See code: [src/commands/init.ts](https://github.com/falexandrou/stackmate-ce/blob/v0.1.0/src/commands/init.ts)_
<!-- commandsstop -->
