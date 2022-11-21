oclif-hello-world
=================

oclif example Hello World CLI

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/oclif-hello-world.svg)](https://npmjs.org/package/oclif-hello-world)
[![CircleCI](https://circleci.com/gh/oclif/hello-world/tree/main.svg?style=shield)](https://circleci.com/gh/oclif/hello-world/tree/main)
[![Downloads/week](https://img.shields.io/npm/dw/oclif-hello-world.svg)](https://npmjs.org/package/oclif-hello-world)
[![License](https://img.shields.io/npm/l/oclif-hello-world.svg)](https://github.com/oclif/hello-world/blob/main/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @stackmate/cli
$ stackmate COMMAND
running command...
$ stackmate (--version)
@stackmate/cli/0.0.0 linux-x64 node-v18.12.1
$ stackmate --help [COMMAND]
USAGE
  $ stackmate COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`stackmate help [COMMAND]`](#stackmate-help-command)
* [`stackmate plugins`](#stackmate-plugins)
* [`stackmate plugins:install PLUGIN...`](#stackmate-pluginsinstall-plugin)
* [`stackmate plugins:inspect PLUGIN...`](#stackmate-pluginsinspect-plugin)
* [`stackmate plugins:install PLUGIN...`](#stackmate-pluginsinstall-plugin-1)
* [`stackmate plugins:link PLUGIN`](#stackmate-pluginslink-plugin)
* [`stackmate plugins:uninstall PLUGIN...`](#stackmate-pluginsuninstall-plugin)
* [`stackmate plugins:uninstall PLUGIN...`](#stackmate-pluginsuninstall-plugin-1)
* [`stackmate plugins:uninstall PLUGIN...`](#stackmate-pluginsuninstall-plugin-2)
* [`stackmate plugins update`](#stackmate-plugins-update)

## `stackmate help [COMMAND]`

Display help for stackmate.

```
USAGE
  $ stackmate help [COMMAND] [-n]

ARGUMENTS
  COMMAND  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for stackmate.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.1.19/src/commands/help.ts)_

## `stackmate plugins`

List installed plugins.

```
USAGE
  $ stackmate plugins [--core]

FLAGS
  --core  Show core plugins.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ stackmate plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v2.1.7/src/commands/plugins/index.ts)_

## `stackmate plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ stackmate plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ stackmate plugins add

EXAMPLES
  $ stackmate plugins:install myplugin 

  $ stackmate plugins:install https://github.com/someuser/someplugin

  $ stackmate plugins:install someuser/someplugin
```

## `stackmate plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ stackmate plugins:inspect PLUGIN...

ARGUMENTS
  PLUGIN  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ stackmate plugins:inspect myplugin
```

## `stackmate plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ stackmate plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ stackmate plugins add

EXAMPLES
  $ stackmate plugins:install myplugin 

  $ stackmate plugins:install https://github.com/someuser/someplugin

  $ stackmate plugins:install someuser/someplugin
```

## `stackmate plugins:link PLUGIN`

Links a plugin into the CLI for development.

```
USAGE
  $ stackmate plugins:link PLUGIN

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Links a plugin into the CLI for development.
  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ stackmate plugins:link myplugin
```

## `stackmate plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ stackmate plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ stackmate plugins unlink
  $ stackmate plugins remove
```

## `stackmate plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ stackmate plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ stackmate plugins unlink
  $ stackmate plugins remove
```

## `stackmate plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ stackmate plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ stackmate plugins unlink
  $ stackmate plugins remove
```

## `stackmate plugins update`

Update installed plugins.

```
USAGE
  $ stackmate plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```
<!-- commandsstop -->
