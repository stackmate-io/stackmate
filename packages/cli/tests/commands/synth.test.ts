import { OPERATION_TYPE, ProjectConfiguration, SERVICE_TYPE } from '@stackmate/engine';

import { createProject } from '@stackmate/cli/core/generator';
import { DEFAULT_PROJECT_FILE } from '@stackmate/cli/constants';
import { runCommand, getWriteFileMock } from 'tests/cli/mocks';
import SynthStackCommand from '@stackmate/cli/commands/synth';

describe('Synth command', () => {
  let config: ProjectConfiguration;
  let writeMock: jest.SpyInstance;

  beforeEach(() => {
    config = createProject({
      projectName: 'my-super-duper-project',
      serviceTypes: [SERVICE_TYPE.MARIADB, SERVICE_TYPE.MYSQL, SERVICE_TYPE.POSTGRESQL],
      stageNames: ['production'],
    });
  });

  it('synthesizes a project and writes out to the default location', async () => {
    writeMock = getWriteFileMock(DEFAULT_PROJECT_FILE);

    const results = await runCommand(
      SynthStackCommand, ['production', OPERATION_TYPE.DEPLOYMENT], config,
    );

    // expect(writeMock).toHaveBeenCalled();
    writeMock.mockRestore();

    console.log(results);
  });

  // it('synthesizes a project and writes out to a custom location');
});
