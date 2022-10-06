import InitCommand from '@stackmate/cli/commands/init';
import { mockInquirerQuestions, runCommand } from 'tests/cli/mocks';

describe('Init Command', () => {
  it('should temporarily do nothing', async () => {
    mockInquirerQuestions(
      { overwrite: true },
      { projectName: 'something', serviceTypes: ['mysql'], stageNames: ['production'] },
    );

    const results = await runCommand(InitCommand, ['--services', 'mysql']);
    console.log(results);
  });

  /*
  it('exits when no configuration has been provided');
  it('should generate the configuration');
  it('prompts the user for the project name');
  it('prompts the user for the stages when none is defined');
  it('prompts the user for the services when none is defined');
  it('exits when the file exists and the user does not want to overwrite');
  it('should proceed when the user wants to overwrite the configuration file');
  */
});
