import { createProject } from '@stackmate/cli/core/generator';

describe('Project generator', () => {
  it('creates a project', () => {
    createProject({
      projectName: 'some-project-name',
      defaultProvider: 'aws',
      defaultRegion: 'eu-central-1',
      secretsProvider: 'aws',
      serviceTypes: ['mysql'],
      stageNames: ['production', 'staging'],
      stateProvider: 'aws',
    });
  });
});
