/* eslint-disable max-classes-per-file */
import App from '@stackmate/engine/lib/terraform/app';
import Stack from '@stackmate/engine/lib/terraform/stack';
import Entity from '@stackmate/engine/core/entity';
import { stackName, appName } from 'tests/fixtures/generic';
import { Attribute, AttributesOf, CloudStack, JsonSchema, NonAttributesOf } from '@stackmate/engine/types';
import { mergeJsonSchemas } from '@stackmate/engine/lib/helpers';

export const getMockApp = (name: string) => (
  new App(name)
);

export const getMockStack = ({ app = getMockApp(appName), name = stackName } = {}): CloudStack => (
  new Stack(app, name)
);

type MockEntityDesc = {
  name: Attribute<string>;
  number: Attribute<number>;
}

type MockEntityAttributes = AttributesOf<MockEntityDesc>;
type MockEntityType = MockEntityAttributes & NonAttributesOf<MockEntityDesc>

export class MockEntity extends Entity<MockEntityAttributes> implements MockEntityType {
  public validationMessage: string = 'The entity is invalid';
  name: string;
  number: number;

  static schema(): JsonSchema<MockEntityAttributes> {
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

type MockEntityExtendedDesc = MockEntityDesc & {
  email: Attribute<string>;
}

type MockEntityExtendedAttributes = AttributesOf<MockEntityExtendedDesc>;
type MockEntityExtendedType = MockEntityExtendedAttributes & NonAttributesOf<MockEntityExtendedDesc>;

export class ExtendedMockEntity extends MockEntity implements MockEntityExtendedType {
  email: string;

  static schema(): JsonSchema<MockEntityExtendedAttributes> {
    return mergeJsonSchemas(super.schema(), {
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
  name: string = 'abc123456';
  number: number = 123456;
}
