import { expect } from 'chai';
import Configuration from '@stackmate/core/configuration';
import Provisioner from '@stackmate/core/provisioner';
import { fullConfig } from 'tests/fixtures';


describe('Provisioner', () => {
  describe('provisioner with full configuration', () => {
    let config: Configuration;
    let provisioner: Provisioner;

    beforeEach(() => {
      // validate the full config fixture
      config = new Configuration(fullConfig, 'somepath.yml');
      expect(config).to.be.an.instanceOf(Configuration);

      provisioner = new Provisioner('production', config.stages['production'], fullConfig.defaults);
    });

    it('runs the thing', async () => {
      const tf = await provisioner.deploy();
      console.log(tf);
    });
  });
});
