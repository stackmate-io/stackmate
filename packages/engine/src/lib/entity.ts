import { isEmpty, isFunction, pick, uniq } from 'lodash';

import { validate } from '@stackmate/lib/validation';
import { BaseEntity } from '@stackmate/interfaces';
import { AttributeParsers, ConstructorOf, EntityAttributes, Validations } from '@stackmate/types';
import { ValidationError } from '@stackmate/lib/errors';

abstract class Entity implements BaseEntity {

  /**
   * @returns {Object} the parsers for the attributes
   */
  abstract parsers(): AttributeParsers;

  /**
   * @returns {Object} the validations to use for the entity
   */
  abstract validations(): Validations;

  /**
   * @var {String} validationMessage the validation message to use
   */
  public readonly abstract validationMessage: string;

  /**
   * @var {Object} attributeState the state of the attributes
   * @private
   */
  private attributeState: EntityAttributes = {};

  /**
   * @returns {Array} the list of attribute names assigned to the entity
   */
  public get attributeNames(): Array<string> {
    const attributeNames = Reflect.getOwnMetadata(this.metadataKey, this) || [];

    let baseClass = Reflect.getPrototypeOf(this);
    while (baseClass instanceof Entity) {
      const baseMetadataKey = Reflect.get(baseClass, 'metadataKey');

      attributeNames.push(
        ...(Reflect.getOwnMetadata(baseMetadataKey, baseClass) || []),
      );

      baseClass = Reflect.getPrototypeOf(baseClass);
    }

    return uniq(attributeNames);
  }

  /**
   * @returns {Object} the attributes
   */
  public get attributes(): EntityAttributes {
    return this.attributeState;
  }

  /**
   * @param {Object} values the attribute values to set
   */
  public set attributes(values: EntityAttributes) {
    const attributes = this.normalize(
      pick(values, this.attributeNames),
    );

    Object.keys(attributes).forEach((attributeKey) => {
      this.setAttribute(attributeKey, values[attributeKey]);
    });
  }

  /**
   * @param {EntityAttributes} attributes the attributes to normalize
   * @returns {EntityAttributes} the normalized attributes
   */
  normalize(attributes: EntityAttributes): EntityAttributes {
    return attributes;
  }

  /**
   * Validates an entity's attributes
   *
   * @param {Object} attributes the entity's attributes to be validated
   * @throws {ValidationError} when the attributes are invalid
   * @void
   */
  validate(): void {
    const errors = validate.validate(this.attributeState, this.validations(), {
      fullMessages: false,
    });

    if (!isEmpty(errors)) {
      throw new ValidationError(this.validationMessage, errors);
    }

    this.initialize();
  }

  /**
   * Checks whether the entity has the attribute specified
   *
   * @param {String} name the name of the attribute to look up
   * @returns {Boolean} whether the entity has the attribute specified
   */
  hasAttribute(name: string): boolean {
    return this.attributeNames.includes(name);
  }

  /**
   * Returns the value for an attribute
   *
   * @param {String} name the name of the attribute to get
   * @returns {Any}
   */
  getAttribute(name: string): any {
    return this.attributeState[name];
  }

  /**
   * Sets an attribute value
   *
   * @param {String} name the name of the attribute to set
   * @param {Any} value the value of the attribute to set
   */
  setAttribute(name: string, value: any): void {
    const { [name]: parser } = this.parsers();

    if (!isFunction(parser)) {
      throw new Error(`No parser has been specified for attribute “${name}”`);
    }

    this.attributeState[name] = parser(value);
  }

  /**
   * @param {String} name the attribute name to register
   */
  registerAttribute(name: string) {
    const attributeMetadata = Reflect.getOwnMetadata(this.metadataKey, this) || [];
    Reflect.defineMetadata(this.metadataKey, [...attributeMetadata, name], this);
  }

  /**
   * @returns {String} the metadata key to use
   */
  get metadataKey(): string {
    return `attributes:${this.constructor.name}`.toLowerCase();
  }

  /**
   * Initializes the entity.
   *
   * The main issue is that we can't set attributes in the constructor, due to a property
   * initialization issue in TypeScript. This method runs after the entity has been
   * instantiated and validated and allows us to perform actions with attributes in place
   *
   * @see https://github.com/microsoft/TypeScript/issues/13525
   * @see https://github.com/microsoft/TypeScript/issues/1617
   * @see https://github.com/microsoft/TypeScript/issues/10634s
   * @see https://stackoverflow.com/questions/43595943/why-are-derived-class-property-values-not-seen-in-the-base-class-constructor/43595944
   */
  protected initialize(): void {}

  /**
   * Instantiates and validates an entity
   *
   * @param {Object} attributes the entity's attributes
   * @returns {Entity} the validated entity instance
   */
  static factory<T extends BaseEntity>(
    this: ConstructorOf<T>,
    attributes: object,
    ...args: any[]
  ): T {
    const entity = new this(...args);
    entity.attributes = attributes;
    entity.validate();

    return entity;
  }
}

export default Entity;
