import InitCommand from '@stackmate/cli/commands/init';

describe('Init Command', () => {
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
    await InitCommand.run([]);
    expect(results).toContain('Test');
  });
});
