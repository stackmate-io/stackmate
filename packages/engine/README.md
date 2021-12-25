stackmate
=========


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
stackmate/0.1.0 darwin-x64 node-v12.21.0
$ stackmate --help [COMMAND]
USAGE
  $ stackmate COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`stackmate deploy STAGE`](#stackmate-deploy-stage)
* [`stackmate destroy STAGE`](#stackmate-destroy-stage)
* [`stackmate help [COMMAND]`](#stackmate-help-command)

## `stackmate deploy STAGE`

deploy resources to the cloud

```
USAGE
  $ stackmate deploy STAGE

ARGUMENTS
  STAGE  the stage to deploy
```

_See code: [src/commands/deploy.ts](https://github.com/stackmate-io/stackmate-ce/blob/v0.1.0/src/commands/deploy.ts)_

## `stackmate destroy STAGE`

deploy resources to the cloud

```
USAGE
  $ stackmate destroy STAGE

ARGUMENTS
  STAGE  the stage to deploy
```

_See code: [src/commands/destroy.ts](https://github.com/stackmate-io/stackmate-ce/blob/v0.1.0/src/commands/destroy.ts)_

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
