import { OPERATION_TYPE, ProjectConfiguration, SERVICE_TYPE, STACKMATE_DIRECTORY } from '@stackmate/engine';

import { createProject } from '@stackmate/cli/core/generator';
import { runCommand, getWriteFileMock } from 'tests/cli/mocks';
import SynthStackCommand from '@stackmate/cli/commands/synth';
import { resolveRelativePath } from '@stackmate/cli/lib';

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
    writeMock = getWriteFileMock(
      `${resolveRelativePath(STACKMATE_DIRECTORY)}/production/deployment.json`,
    );

    const results = await runCommand(
      SynthStackCommand, ['production', OPERATION_TYPE.DEPLOYMENT], config,
    );

    expect(results).toMatchObject({
      output: expect.stringContaining('output file created'),
      exitCode: undefined,
      errorMessage: undefined,
      error: undefined,
    });

    expect(writeMock).toHaveBeenCalled();
    const [[filename, contents]] = writeMock.mock.calls;

    expect(
      (filename as string).endsWith(`${STACKMATE_DIRECTORY}/production/deployment.json`),
    ).toBe(true);

    const parsed = JSON.parse(contents);
    expect(parsed).toBeInstanceOf(Object);
    expect(new Set(Object.keys(parsed))).toEqual(new Set([
      '//', 'data', 'locals', 'provider', 'resource', 'terraform',
    ]));

    writeMock.mockRestore();
  });

  it('synthesizes a project and writes out to an absolute custom location', async () => {
    const absolutePath = '/home/my-test-user';
    writeMock = getWriteFileMock(`${absolutePath}/production/deployment.json`);

    await runCommand(SynthStackCommand, [
      'production', OPERATION_TYPE.DEPLOYMENT, '--output', absolutePath,
    ], config);

    expect(writeMock).toHaveBeenCalled();
    const [[filename, contents]] = writeMock.mock.calls;

    expect(filename).toEqual('/home/my-test-user/production/deployment.json');

    const parsed = JSON.parse(contents);
    expect(parsed).toBeInstanceOf(Object);
    expect(new Set(Object.keys(parsed))).toEqual(new Set([
      '//', 'data', 'locals', 'provider', 'resource', 'terraform',
    ]));

    writeMock.mockRestore();
  });
});
