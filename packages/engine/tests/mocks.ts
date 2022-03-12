/* eslint-disable max-classes-per-file */
import App from '@stackmate/lib/terraform/app';
import Stack from '@stackmate/lib/terraform/stack';
import Entity from '@stackmate/lib/entity';
import Parser from '@stackmate/lib/parsers';
import ServiceRegistry from '@stackmate/core/registry';
import { CloudStack } from '@stackmate/interfaces';
import { Attribute } from '@stackmate/lib/decorators';
import { stackName, appName } from 'tests/fixtures/generic';
import { AttributeParsers, ServiceAttributes, ServiceScopeChoice, Validations } from '@stackmate/types';

export const getMockApp = (name: string) => (
  new App(name)
);

export const getMockStack = ({ app = getMockApp(appName), name = stackName } = {}): CloudStack => (
  new Stack(app, name)
);

export const multiply = (value: number, { times = 5 } = {}) => (
  value * times
);

export const getMockService = (
  attrs: ServiceAttributes, scope: ServiceScopeChoice = 'deployable',
) => {
  const { provider, type } = attrs;
  return ServiceRegistry.get({ provider, type }).factory(attrs).scope(scope)
};

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
