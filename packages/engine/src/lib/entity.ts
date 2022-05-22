import {
  BaseEntity,
  EntityAttributes,
  BaseEntityConstructor,
} from '@stackmate/engine/types';

abstract class Entity<Attrs extends EntityAttributes> implements BaseEntity {
  /**
   * @var {Object} attributeState the state of the attributes
   * @private
   */
  private attributeState: Attrs;

  /**
   * @returns {Array} the list of attribute names assigned to the entity
   */
  get attributeNames() {
    return Object.keys(this.attributeState);
  }

  /**
   * @returns {Object} the attributes
   */
  public get attributes(): Attrs {
    return this.attributeState;
  }

  /**
   * @param {Object} values the attribute values to set
   */
  public set attributes(values: Attrs) {
    Object.keys(values).forEach((attributeKey) => {
      this.setAttribute(attributeKey, values[attributeKey]);
    });
  }

  /**
   * Validates an entity's attributes
   *
   * @param {Object} attributes the entity's attributes to be validated
   * @throws {ValidationError} when the attributes are invalid
   * @void
   */
  validate(): void {
    /*
    const errors = validate.validate(this.attributeState, this.validations(), {
      fullMessages: false,
    });

    if (!isEmpty(errors)) {
      throw new ValidationError(this.validationMessage, errors);
    }
    */

    this.initialize();
  }

  /**
   * Checks whether the entity has the attribute specified
   *
   * @param {String} name the name of the attribute to look up
   * @returns {Boolean} whether the entity has the attribute specified
   */
  protected hasAttribute(name: string): boolean {
    return this.attributeNames.includes(name);
  }

  /**
   * Returns the value for an attribute
   *
   * @param {String} name the name of the attribute to get
   * @returns {Any}
   */
  protected getAttribute(name: string): any {
    return this.attributeState[name];
  }

  /**
   * Sets an attribute value
   *
   * @param {String} name the name of the attribute to set
   * @param {Any} value the value of the attribute to set
   */
  protected setAttribute(name: keyof Attrs, value: any): void {
    Object.assign(this, { name: value });
    this.attributeState[name] = value;
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
   * Normalizes the entity's attributes
   *
   * @param {EntityAttributes} attributes the attributes to normalize
   * @returns {EntityAttributes} the normalized attributes
   */
  static normalize(attributes: EntityAttributes): EntityAttributes {
    return attributes;
  }

  /**
   * Instantiates and validates an entity
   *
   * @param {Object} attributes the entity's attributes
   * @returns {Entity} the validated entity instance
   */
  static factory<T extends BaseEntity>(
    this: BaseEntityConstructor<T>,
    attributes: EntityAttributes,
    ...args: any[]
  ): T {
    const entity = new this(...args);
    entity.attributes = this.normalize(attributes);
    entity.validate();
    return entity;
  }
}

export default Entity;
