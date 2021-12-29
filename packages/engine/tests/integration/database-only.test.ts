import fs from 'fs';
import YAML from 'yaml';
import sinon from 'sinon';
import 'cdktf/lib/testing/adapters/jest';

import { AWS_REGIONS, DEFAULT_RDS_INSTANCE_SIZE } from '@stackmate/clouds/aws/constants';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/constants';
import { Project } from '@stackmate/main';
import { inputPath, outputPath } from 'tests/fixtures';

const projectConfig = {
  name: 'database-only-project',
  provider: PROVIDER.AWS,
  region: AWS_REGIONS.EU_CENTRAL_1,
  stages: {
    production: {
      mysqlDatabase: {
        type: SERVICE_TYPE.DATABASE,
        size: DEFAULT_RDS_INSTANCE_SIZE,
        profile: 'production',
      },
    },
  },
};

describe('Database only project', () => {
  let readStub: sinon.SinonStub;
  let existsStub: sinon.SinonStub;
  let writeStub: sinon.SinonStub;
  let scopeContents: string;

  beforeEach(() => {
    readStub = sinon.stub(fs.promises, 'readFile');
    readStub.withArgs(inputPath).resolves(YAML.stringify(projectConfig));

    existsStub = sinon.stub(fs, 'existsSync');
    existsStub.withArgs(inputPath).returns(true);

    writeStub = sinon.stub(fs.promises, 'writeFile');
    writeStub.withArgs(outputPath).callsFake((path, contents) => new Promise((resolve) => {
      scopeContents = contents;
      return resolve(contents);
    }));
  });

  afterEach(() => {
    readStub.restore();
    existsStub.restore();
    writeStub.restore();
  });

  it('provisions the production stage for the project', async () => {
    try {
      await Project.synthesize(inputPath, 'production');
    } catch (err) {
      console.log(require('util').inspect(err));
    }
    console.log(scopeContents);
  });
});
