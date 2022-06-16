import InitCommand from '@stackmate/cli/commands/init';

describe('Init Command', () => {
  let results: any = [];

  beforeEach(() => {
    results = [];
    jest.spyOn(process.stdout, 'write').mockImplementation(val => results.push(val));
  });

  afterEach(() => jest.restoreAllMocks());

  it('should temporarily do nothing', async () => {
    await InitCommand.run([]);
    expect(results).toContain('Test')
  });
});
