import YAML from 'yaml';
import { BaseServiceAttributes, ProjectConfiguration, SERVICE_TYPE, StageConfiguration, ValidationError } from '@stackmate/engine';

import { DEFAULT_PROJECT_FILE } from '@stackmate/cli/constants';
import { createProject } from '@stackmate/cli/core/generator';
import { getFileExistsMock, getReadFileMock, getWriteFileMock, runCommand } from 'tests/cli/mocks';
import StageCopyCommand from '@stackmate/cli/commands/copy';

describe('Init Command', () => {
  let config: ProjectConfiguration;
  let writeMock: jest.SpyInstance;
  let existsMock: jest.SpyInstance;

  beforeAll(() => {
    config = createProject({
      projectName: 'my-super-duper-project',
      serviceTypes: [SERVICE_TYPE.MARIADB, SERVICE_TYPE.MYSQL, SERVICE_TYPE.POSTGRESQL],
      stageNames: ['production'],
    });
  });

  beforeEach(() => {
    getReadFileMock(DEFAULT_PROJECT_FILE, YAML.stringify(config));
    writeMock = getWriteFileMock(DEFAULT_PROJECT_FILE);
    existsMock = getFileExistsMock(DEFAULT_PROJECT_FILE, true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('raises an error when the configuration file does not exist', async () => {
    existsMock = getFileExistsMock(DEFAULT_PROJECT_FILE, false);
    const results = await runCommand(StageCopyCommand, ['production', 'staging']);

    expect(writeMock).not.toHaveBeenCalled();
    expect(results).toMatchObject({
      output: expect.stringContaining('configuration not found'),
      exitCode: 1,
      errorMessage: expect.stringContaining('EEXIT'),
    });

    existsMock.mockRestore();
  });

  it('raises an error when the source stage does not exist', async () => {
    const results = await runCommand(StageCopyCommand, ['this-stage-does-not-exist', 'staging']);
    expect(writeMock).not.toHaveBeenCalled();
    expect(results.error).not.toBeUndefined();
    expect(results).toMatchObject({
      output: '',
      errorMessage: expect.stringContaining('this-stage-does-not-exist not found'),
    });
  });

  it('raises an error when the target stage is invalid', async () => {
    const results = await runCommand(StageCopyCommand, ['production', 'invalid stage name']);
    expect(writeMock).not.toHaveBeenCalled();
    expect(results.error).not.toBeUndefined();
    expect(results.error).toBeInstanceOf(ValidationError);
    expect(results).toMatchObject({
      output: '',
      errorMessage: expect.stringContaining('Error while validating schema'),
    });
  });

  it('copies a stage using the shorthand syntax', async () => {
    const results = await runCommand(StageCopyCommand, ['production', 'staging']);

    expect(results).toMatchObject({
      output: expect.stringContaining('Stage staging added to the project'),
      error: undefined,
      errorMessage: undefined,
    });

    expect(writeMock).toHaveBeenCalled();
    const [[filename, contents]] = writeMock.mock.calls;

    expect(filename).toEqual(DEFAULT_PROJECT_FILE);
    expect(YAML.parse(contents)).toMatchObject({
      ...config,
      stages: expect.arrayContaining([
        expect.objectContaining({
          name: 'production',
        }), {
          name: 'staging',
          copy: 'production',
        },
      ]),
    });
  });

  it('copies a stage and skips certain services', async () => {
    const results = await runCommand(StageCopyCommand, [
      'production', 'staging',
      '--skip', 'mysql-production-database,mariadb-production-database',
    ]);

    expect(results).toMatchObject({
      output: expect.stringContaining('Stage staging added to the project'),
      error: undefined,
      errorMessage: undefined,
    });

    expect(writeMock).toHaveBeenCalled();
    const [[filename, contents]] = writeMock.mock.calls;

    expect(filename).toEqual(DEFAULT_PROJECT_FILE);
    expect(YAML.parse(contents)).toMatchObject({
      ...config,
      stages: expect.arrayContaining([
        expect.objectContaining({
          name: 'production',
        }), {
          name: 'staging',
          copy: 'production',
          skip: expect.arrayContaining([
            'mysql-production-database',
            'mariadb-production-database',
          ]),
        },
      ]),
    });
  });

  it('copies a stage in full', async () => {
    const results = await runCommand(StageCopyCommand, ['production', 'staging', '--full']);

    expect(results).toMatchObject({
      output: expect.stringContaining('Stage staging added to the project'),
      error: undefined,
      errorMessage: undefined,
    });

    expect(writeMock).toHaveBeenCalled();
    const [[filename, contents]] = writeMock.mock.calls;

    expect(filename).toEqual(DEFAULT_PROJECT_FILE);
    expect(YAML.parse(contents)).toMatchObject({
      ...config,
      stages: expect.arrayContaining([
        expect.objectContaining({
          name: 'production',
        }), {
          name: 'staging',
          services: expect.arrayContaining([
            { name: 'mysql-staging-database', type: SERVICE_TYPE.MYSQL },
            { name: 'mariadb-staging-database', type: SERVICE_TYPE.MARIADB },
            { name: 'postgresql-staging-database', type: SERVICE_TYPE.POSTGRESQL },
          ]),
        },
      ]),
    });
  });

  it('copies a stage in full and skips certain services', async () => {
    const results = await runCommand(StageCopyCommand, [
      'production', 'staging', '--full', '--skip', 'mysql-production-database',
    ]);

    expect(results).toMatchObject({
      output: expect.stringContaining('Stage staging added to the project'),
      error: undefined,
      errorMessage: undefined,
    });

    expect(writeMock).toHaveBeenCalled();
    const [[filename, contents]] = writeMock.mock.calls;

    expect(filename).toEqual(DEFAULT_PROJECT_FILE);
    const parsed = YAML.parse(contents);
    expect(parsed).toMatchObject({
      ...config,
      stages: expect.arrayContaining([
        expect.objectContaining({
          name: 'production',
        }), {
          name: 'staging',
          services: expect.arrayContaining([
            { name: 'mariadb-staging-database', type: SERVICE_TYPE.MARIADB },
            { name: 'postgresql-staging-database', type: SERVICE_TYPE.POSTGRESQL },
          ]),
        },
      ]),
    });

    const stagingServices = parsed.stages.filter(
      (st: StageConfiguration<true>) => st.name === 'staging',
    ).map(
      (st: StageConfiguration<true>) => st.services,
    ).flat();

    expect(new Set(stagingServices.map((s: BaseServiceAttributes) => s.type))).toEqual(
      new Set(['mariadb', 'postgresql']),
    );
    expect(new Set(stagingServices.map((s: BaseServiceAttributes) => s.name))).toEqual(
      new Set(['mariadb-staging-database', 'postgresql-staging-database']),
    );
  });
});
