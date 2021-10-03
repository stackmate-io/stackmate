import React from 'react';
import Command from '@oclif/command';
// This is to mitigate missing types in packages that cdktf depens upon
const { Deploy } = require('cdktf-cli/bin/cmds/ui/deploy');
const { renderInk } = require('cdktf-cli/bin/cmds/helper/render-ink');

import { SYNTH_COMMAND } from '@stackmate/core/constants';
import { WithErrorHandler } from '@stackmate/core/decorators';
import Provisioner from '@stackmate/core/provisioner';

class DeployCommand extends Command {
  static description = 'deploy resources to the cloud';

  static args = [{
    name: 'stage',
    required: true,
    description: 'the stage to deploy',
  }];

  @WithErrorHandler()
  async run() {
    const file = './examples/sample.yml';
    const stage = 'production';

    const provisioner = await Provisioner.synth(file, stage);

    await renderInk(
      React.createElement(Deploy, {
        targetStack: stage,
        targetDir: provisioner.rootPath,
        synthCommand: SYNTH_COMMAND,
        autoApprove: false,
      }),
    );
  }
}

export default DeployCommand;
