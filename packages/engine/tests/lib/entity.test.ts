import faker from 'faker';

import { ValidationError } from '@stackmate/lib/errors';
import { MockEntity, ExtendedMockEntity, multiply } from 'tests/mocks';

describe('Entity', () => {
  describe('setters / getter', () => {
    let subject;
    let attributes: object;
    let name: string;
    let number: number;
    let email: string;
    let extendedAttributes: object;

    beforeEach(() => {
      name = faker.name.firstName();
      number = faker.datatype.number();
      email = faker.internet.email();
      attributes = { name, number };
      extendedAttributes = { name, number, email };
    });

    it('instantiates the entity class properly', () => {
      subject = new MockEntity(attributes);
      expect(subject).toBeInstanceOf(MockEntity);
      expect(subject.name).toEqual(name);
      expect(subject.number).toEqual(multiply(number));
    });

    it('returns the attribute names', () => {
      subject = new MockEntity(attributes);
      expect(subject.attributeNames).toStrictEqual(['name', 'number']);
    });

    it('instantiates an extended object', () => {
      subject = new ExtendedMockEntity(extendedAttributes);
      expect(subject).toBeInstanceOf(MockEntity);
      expect(subject.name).toEqual(name);
      expect(subject.number).toEqual(multiply(number));
      expect(subject.email).toEqual(email);
    });

    it('returns the expected attributes for the extended object', () => {
      subject = new ExtendedMockEntity(extendedAttributes);
      expect(subject).toBeInstanceOf(MockEntity);
      expect(new Set(subject.attributeNames)).toEqual(new Set(['name', 'number', 'email']));
    });
  });

  describe('parsers', () => {
    it('parses the attribute values', () => {
      const name: string = faker.name.firstName();
      const number: number = faker.datatype.number();

      const attributes = {
        name: ` ${name} `, // notice the spaces
        number: String(number),
      };

      const subject = new MockEntity(attributes);
      expect(subject).toBeInstanceOf(MockEntity);
      expect(subject.name).toEqual(name);
      expect(subject.number).toEqual(multiply(number));
    });
  });

  describe('validators', () => {
    it('raises validation errors', () => {
      const subject = new MockEntity({ name: '', number: 'abc' });
      expect(subject).toBeInstanceOf(MockEntity);
      try {
        subject.validate();
        throw new Error('Expected to throw within `validate` but did not');
      } catch (error) {
        const err: ValidationError = error as ValidationError;
        expect(err).toBeInstanceOf(ValidationError);
        expect(err.message).toEqual('The entity is invalid');
        expect(err.errors).toBeInstanceOf(Object);
        expect(err.errors).toMatchObject({
          name: ['You have to specify a name to use'],
          number: ['The number provided is invalid']
        });
      }
    });
  });
});
