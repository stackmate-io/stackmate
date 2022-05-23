import { faker } from '@faker-js/faker';

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
      subject = new MockEntity();
      subject.attributes = attributes;
      expect(subject).toBeInstanceOf(MockEntity);
      expect(subject.name).toEqual(name);
      expect(subject.number).toEqual(multiply(number));
    });

    it('instantiates an extended object', () => {
      subject = new ExtendedMockEntity();
      subject.attributes = extendedAttributes;
      expect(subject).toBeInstanceOf(MockEntity);
      expect(subject.name).toEqual(name);
      expect(subject.number).toEqual(multiply(number));
      expect(subject.email).toEqual(email);
    });

    it('returns the expected attributes for the extended object', () => {
      subject = new ExtendedMockEntity();
      subject.attributes = extendedAttributes;
      expect(subject).toBeInstanceOf(MockEntity);
    });
  });
});
