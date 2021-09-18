import path from 'path';
import { expect } from 'chai';

import { PROVIDER, REGION, SERVICE_TYPE } from '@stackmate/core/constants';
import Project from '@stackmate/core/project';
import Configuration from '@stackmate/core/configuration';
import { ConfigurationFileContents } from '@stackmate/types';

describe('Project', () => {
  let configuration: Configuration;

  beforeEach(() => {
    const configContents: ConfigurationFileContents = {
      name: 'my-project',
      provider: PROVIDER.AWS,
      region: REGION[PROVIDER.AWS].EU_CENTRAL_1,
      stages: {
        production: {
          database: {
            type: SERVICE_TYPE.MYSQL,
            size: 'db.t3.medium',
            engine: 'mysql',
            database: 'my-database',
            storage: 50,
          },
        },
      },
    };

    const filePath = path.join(process.cwd(), '.stackmate', 'config.yml');
    configuration = new Configuration(configContents, filePath);
  });

  describe('constructor', () => {
    it('constructs the project', () => {
      const project = new Project(configuration);
      expect(project).to.be.an.instanceOf(Project);
    });
  });
});
