/* eslint-disable max-classes-per-file */
import App from '@stackmate/engine/lib/terraform/app';
import Stack from '@stackmate/engine/lib/terraform/stack';
import Entity from '@stackmate/engine/lib/entity';
import { stackName, appName } from 'tests/fixtures/generic';
import { Attribute, AttributesOf, CloudStack, JsonSchema } from '@stackmate/engine/types';
import { mergeJsonSchemas } from '@stackmate/engine/lib/helpers';

export const getMockApp = (name: string) => (
  new App(name)
);

export const getMockStack = ({ app = getMockApp(appName), name = stackName } = {}): CloudStack => (
  new Stack(app, name)
);

export const multiply = (value: number, { times = 5 } = {}) => (
  value * times
);

type MockEntityDesc = {
  name: Attribute<string>;
  number: Attribute<number>;
}

type MockEntityAttributeSet = AttributesOf<MockEntityDesc>;

export class MockEntity extends Entity implements MockEntityDesc {
  public validationMessage: string = 'The entity is invalid';

  name: Attribute<string>;

  number: Attribute<number>;

  static schema(): JsonSchema<MockEntityAttributeSet> {
    return {
      type: 'object',
      required: ['name'],
      properties: {
        name: {
          type: 'string',
        },
        number: {
          type: 'number',
          format: 'int32',
          errorMessage: 'The number provided is invalid',
        },
      },
      errorMessage: {
        required: {
          name: 'You have to specify a name to use',
        }
      }
    };
  }
}

type MockEntityExtendedDesc = {
  name: Attribute<string>;
  number: Attribute<number>;
}

type MockEntityExtendedAttributeSet = AttributesOf<MockEntityExtendedDesc>;

export class ExtendedMockEntity extends MockEntity implements MockEntityExtendedDesc {
  email: Attribute<string>;

  static schema(): JsonSchema<MockEntityExtendedAttributeSet> {
    return mergeJsonSchemas<MockEntityAttributeSet, MockEntityExtendedAttributeSet>(super.schema(), {
      required: ['email'],
      properties: {
        email: {
          type: 'string',
          format: 'email',
          errorMessage: 'You have to specify an email',
        },
      },
    });
  }
}

export class MockEntityWithDefaults extends MockEntity {
  name: Attribute<string> = 'default-name';
  number: Attribute<number> = 123456;
}
