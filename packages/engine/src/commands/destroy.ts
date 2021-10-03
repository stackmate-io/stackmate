import React from 'react';
import Command from '@oclif/command';
// This is to mitigate missing types in packages that cdktf depens upon
const { renderInk } = require('cdktf-cli/bin/cmds/helper/render-ink');
const { Destroy } = require('cdktf-cli/bin/cmds/ui/destroy');

import { SYNTH_COMMAND } from '@stackmate/core/constants';
import Provisioner from '@stackmate/core/provisioner';

class DeployCommand extends Command {
  static description = 'deploy resources to the cloud';

  static args = [{
    name: 'stage',
    required: true,
    description: 'the stage to deploy',
  }];

  async run() {
    const file = './examples/sample.yml';
    const stage = 'production';

    const provisioner = await Provisioner.synth(file, stage);

    await renderInk(
      React.createElement(Destroy, {
        targetStack: stage,
        targetDir: provisioner.rootPath,
        synthCommand: SYNTH_COMMAND,
        autoApprove: false,
      }),
    );
  }
}

export default DeployCommand;
