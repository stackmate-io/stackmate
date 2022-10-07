import YAML from 'yaml';
import { DEFAULT_PROJECT_FILE } from '@stackmate/cli/constants';
import { getFileExistsMock, getWriteFileMock, mockInquirerQuestions, runCommand } from 'tests/cli/mocks';
import InitCommand from '@stackmate/cli/commands/init';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine';

describe('Init Command', () => {
  let writeMock: jest.SpyInstance;

  describe('when configuration file does not exist', () => {
    beforeEach(() => {
      writeMock = getWriteFileMock(DEFAULT_PROJECT_FILE);
      getFileExistsMock(DEFAULT_PROJECT_FILE, false);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('generates the configuration when passing arguments and file does not exist', async () => {
      const results = await runCommand(InitCommand, [
        '--name', 'my-project-name',
        '--services', 'mysql,postgresql',
        '--stages', 'production,staging',
      ]);

      expect(results).toMatchObject({
        output: expect.stringContaining('file created'),
        exitCode: undefined,
        errorMessage: undefined,
        error: undefined,
      });

      expect(writeMock).toHaveBeenCalled();
      const [[filename, contents]] = writeMock.mock.calls;
      expect(filename).toContain(DEFAULT_PROJECT_FILE);

      expect(YAML.parse(contents)).toMatchObject({
        name: 'my-project-name',
        provider: PROVIDER.AWS,
        state: {
          bucket: expect.stringContaining('stackmate-state'),
        },
        stages: expect.arrayContaining([
          {
            name: 'production',
            services: expect.arrayContaining([{
              name: expect.stringContaining('production-database'),
              type: SERVICE_TYPE.MYSQL,
            }, {
              name: expect.stringContaining('production-database'),
              type: SERVICE_TYPE.POSTGRESQL,
            }]),
          }, {
            name: 'staging',
            copy: 'production',
          }
        ]),
      });
    });

    it('generates the configuration file via prompts when the file does not exist', async () => {
      mockInquirerQuestions({
        projectName: 'my-awesome-project',
        serviceTypes: ['mysql', 'postgresql'],
        stageNames: ['production', 'staging'],
      });

      const results = await runCommand(InitCommand, []);

      expect(results).toMatchObject({
        output: expect.stringContaining('file created'),
        exitCode: undefined,
        errorMessage: undefined,
        error: undefined,
      });

      expect(writeMock).toHaveBeenCalled();
      const [[filename, contents]] = writeMock.mock.calls;
      expect(filename).toContain(DEFAULT_PROJECT_FILE);

      expect(YAML.parse(contents)).toMatchObject({
        name: 'my-awesome-project',
        provider: PROVIDER.AWS,
        state: {
          bucket: expect.stringContaining('stackmate-state'),
        },
        stages: expect.arrayContaining([
          {
            name: 'production',
            services: expect.arrayContaining([{
              name: expect.stringContaining('production-database'),
              type: SERVICE_TYPE.MYSQL,
            }, {
              name: expect.stringContaining('production-database'),
              type: SERVICE_TYPE.POSTGRESQL,
            }]),
          }, {
            name: 'staging',
            copy: 'production',
          }
        ]),
      });
    });

    it('throws an error when no configuration has been provided', async () => {
      // empty answers to prompts
      mockInquirerQuestions({});

      // empty set of arguments passed
      const results = await runCommand(InitCommand, []);

      expect(results).toMatchObject({
        output: expect.stringContaining('No configuration provided'),
        errorMessage: expect.stringContaining('You need to provide at least one service'),
      });
    });
  });

  describe('when configuration file exists', () => {
    beforeEach(() => {
      writeMock = getWriteFileMock(DEFAULT_PROJECT_FILE);
      getFileExistsMock(DEFAULT_PROJECT_FILE, true);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('exits when the file exists and the user does not want to overwrite', async () => {
      mockInquirerQuestions({ overwrite: false });

      // empty set of arguments passed
      const results = await runCommand(InitCommand, []);
      expect(results).toMatchObject({
        output: expect.stringContaining('keeping the existing file'),
        errorMessage: expect.stringContaining('EEXIT'),
      });

      expect(results.error).not.toBeUndefined();
    });

    it('should proceed when the user wants to overwrite the configuration file', async () => {
      mockInquirerQuestions({ overwrite: true }, {
        projectName: 'something-amazing',
        serviceTypes: ['mariadb', 'mysql'],
        stageNames: ['production', 'qa'],
      });

      const results = await runCommand(InitCommand, []);

      expect(results).toMatchObject({
        output: expect.stringContaining('file created'),
        exitCode: undefined,
        errorMessage: undefined,
        error: undefined,
      });

      expect(writeMock).toHaveBeenCalled();
      const [[filename, contents]] = writeMock.mock.calls;
      expect(filename).toContain(DEFAULT_PROJECT_FILE);

      expect(YAML.parse(contents)).toMatchObject({
        name: 'something-amazing',
        provider: PROVIDER.AWS,
        state: {
          bucket: expect.stringContaining('stackmate-state'),
        },
        stages: expect.arrayContaining([
          {
            name: 'production',
            services: expect.arrayContaining([{
              name: expect.stringContaining('production-database'),
              type: SERVICE_TYPE.MARIADB,
            }, {
              name: expect.stringContaining('production-database'),
              type: SERVICE_TYPE.MYSQL,
            }]),
          }, {
            name: 'qa',
            copy: 'production',
          }
        ]),
      });
    });
  });
});
