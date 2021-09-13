import { expect } from 'chai';

import { PROVIDER, REGION, SERVICE_TYPE } from '../src/core/constants';
import { ConfigurationFileContents } from '../src/types';
import Configuration from '../src/core/configuration';
import { ValidationError } from '../src/core/errors';

describe('Configuration', () => {
  describe('validations', () => {
    const configPath = '/some/path.yml';

    it('raises a validation error for an empty configuration', () => {
      let errors;
      let cfg;

      try {
        cfg = new Configuration({}, configPath);
      } catch (error) {
        expect(error).to.be.an.instanceOf(ValidationError);
        expect(error.message).to.equal('The project’s configuration file is not valid');
        errors = error.errors;
      }

      expect(cfg).to.be.undefined;
      expect(errors).to.be.an('Object');
      expect(errors).to.deep.equal({
        name: ['You have to provide a name for the project'],
        provider: ['A default cloud provider should be specified'],
        region: [
          'A default region (that corresponds to the regions that the default cloud provider provides) should be specified',
        ],
        stages: ['You have to provide a set of stages for the project'],
      });
    });

    it('raises a validation error when the wrong options are provided', () => {
      const invalidConfig = {
        name: '',
        provider: 'some-cloud-provider',
        region: 'the-whole-world',
        stages: {
          production: {
            instance: {
              provider: 'some-provider',
              region: 'the-world',
              type: 'fake-service',
            },
          },
        },
      };

      let errors;
      let cfg;

      try {
        cfg = new Configuration(invalidConfig as ConfigurationFileContents, configPath);
      } catch (error) {
        errors = error.errors;
        expect(error).to.be.an.instanceOf(ValidationError);
        expect(error.message).to.equal('The project’s configuration file is not valid');
      }

      expect(cfg).to.be.undefined;
      expect(errors).to.be.an('Object');
      expect(errors).to.deep.equal({
        name: ['You have to provide a name for the project'],
        provider: ['The default cloud provider is invalid. Available options are aws'],
        stages: ['You have to specify a type for every service in the stages'],
      });
    });

    it('doesn’t raise an error for a valid configuration schema', () => {
      const validConfig: ConfigurationFileContents = {
        name: 'Sample project',
        provider: PROVIDER.AWS,
        region: REGION[PROVIDER.AWS].EU_CENTRAL_1,
        stages: {
          production: {
            database: {
              type: SERVICE_TYPE.MYSQL,
            },
          },
        },
      };

      const cfg = new Configuration(validConfig, configPath);
      expect(cfg).to.be.an.instanceOf(Configuration);
      expect(cfg.path).to.deep.equal(configPath);
      expect(cfg.name).to.deep.equal(validConfig.name);
      expect(cfg.defaults).to.deep.equal({});
      expect(cfg.stages).to.deep.equal({
        production: {
          database: {
            name: 'database',
            provider: PROVIDER.AWS,
            region: REGION[PROVIDER.AWS].EU_CENTRAL_1,
            type: SERVICE_TYPE.MYSQL,
          },
        },
      });
    });
  });
});
