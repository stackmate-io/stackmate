import Service from '@stackmate/core/service';
import Parser from '@stackmate/lib/parsers';
import { SERVICE_TYPE } from '@stackmate/constants';
import { ServiceTypeChoice } from '@stackmate/types';
import { Attribute } from '@stackmate/lib/decorators';

abstract class Provider extends Service {
  /**
   * @var {String} alias the alias for the provider (eg. aws_eu_central_1)
   */
  @Attribute alias: string;

  /**
   * @var {ServiceTypeChoice} type the service's type
   */
  readonly type: ServiceTypeChoice = SERVICE_TYPE.PROVIDER;

  /**
   * @returns {Object} the parser functions to apply to the service's attributes
   */
  parsers() {
    return {
      ...super.parsers(),
      alias: Parser.parseString,
    };
  }

  /**
   * @returns {Validations} the validations for the service
   */
  validations() {
    return {
      ...super.validations(),
      alias: {
        presence: {
          allowEmpty: false,
        },
        format: {
          pattern: '^([0-9A-Za-z_]+)$',
          message: 'Please provide a valid alias for the provider',
        }
      },
    };
  }
}

export default Provider;
