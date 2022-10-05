import InitCommand from '@stackmate/cli/commands/init';

describe.skip('Init Command', () => {
  let results: string = '';

  beforeEach(() => {
    results = '';

    jest.spyOn(process.stdout, 'write').mockImplementation(val => {
      results += val.toString();
      return true;
    });
  });

  afterEach(() => jest.restoreAllMocks());

  it('should temporarily do nothing', async () => {
    await InitCommand.run(['--services', 'mysql']);
    console.log(results)
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
