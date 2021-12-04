import React from 'react';
import Command from '@oclif/command';
// This is to mitigate missing types in packages that cdktf depens upon
const { Deploy } = require('cdktf-cli/bin/cmds/ui/deploy');
const { renderInk } = require('cdktf-cli/bin/cmds/helper/render-ink');

import { STORAGE, SYNTH_COMMAND } from '@stackmate/core/constants';
import { WithErrorHandler } from '@stackmate/core/decorators';
import Provisioner from '@stackmate/core/provisioner';
import Project from '@stackmate/core/project';

class DeployCommand extends Command {
  static description = 'deploy resources to the cloud';

  static args = [{
    name: 'stage',
    required: true,
    description: 'the stage to deploy',
  }];

  @WithErrorHandler()
  async run() {
    const path = './examples/sample.yml';
    const stage = 'production';

    const project = new Project({ storage: STORAGE.FILE, path });
    await project.load();

    const provisioner = new Provisioner(project, stage);

    // const provisioner = await Provisioner.synth(file, stage);
    // const provisioner = new Provisioner(project, stage);
    // const provisioner = new Provisioner(stage);
    // provisioner.defaults = project.contents.defaults;
    // provisioner.services = project.stage(stage);
    // , project.stage(stage), project.contents.defaults,
    // await provisioner.synth();
    // await project.load();
    // await project.verify();

    // const provisioner = await Provisioner.synth(file, stage);

    await renderInk(
      React.createElement(Deploy, {
        targetStack: stage,
        targetDir: provisioner.targetPath,
        synthCommand: SYNTH_COMMAND,
        autoApprove: false,
      }),
    );
  }
}

export default DeployCommand;
