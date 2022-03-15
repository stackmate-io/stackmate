/* eslint-disable max-classes-per-file */
import App from '@stackmate/engine/lib/terraform/app';
import Stack from '@stackmate/engine/lib/terraform/stack';
import Entity from '@stackmate/engine/lib/entity';
import Parser from '@stackmate/engine/lib/parsers';
import { CloudStack } from '@stackmate/engine/interfaces';
import { Attribute } from '@stackmate/engine/lib/decorators';
import { stackName, appName } from '@stackmate/engine-tests/fixtures/generic';
import { AttributeParsers, Validations } from '@stackmate/engine/types';

export const getMockApp = (name: string) => (
  new App(name)
);

export const getMockStack = ({ app = getMockApp(appName), name = stackName } = {}): CloudStack => (
  new Stack(app, name)
);

export const multiply = (value: number, { times = 5 } = {}) => (
  value * times
);

export class MockEntity extends Entity {
  public validationMessage: string = 'The entity is invalid';

  @Attribute name: string;

  @Attribute number: number;

  parsers(): AttributeParsers {
    return {
      name: Parser.parseString,
      number: multiply,
    };
  }

  validations(): Validations {
    return {
      name: {
        presence: {
          allowEmpty: false,
          message: 'You have to specify a name to use',
        },
      },
      number: {
        numericality: {
          message: 'The number provided is invalid',
        },
      },
    };
  }
}

export class ExtendedMockEntity extends MockEntity {
  @Attribute email: string;

  parsers(): AttributeParsers {
    return {
      ...super.parsers(),
      email: Parser.parseString,
    };
  }

  validations(): Validations {
    return {
      ...super.validations(),
      email: {
        presence: {
          allowEmpty: false,
          message: 'You have to specify an email',
        },
      },
    };
  }
}
