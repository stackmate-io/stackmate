import { validate } from '@stackmate/engine/core/validation';
import {
  BaseEntity,
  EntityAttributes,
  BaseEntityConstructor,
  BaseJsonSchema,
} from '@stackmate/engine/types';

abstract class Entity<Attrs extends EntityAttributes = {}> implements BaseEntity {
  /**
   * @var {String} schemaId the schema id for the entity
   * @static
   */
  static schemaId: string = 'base/entity';

  /**
   * @var {Object} attributeState the state of the attributes
   * @private
   */
  private attributeState: Partial<Attrs> = {};

  /**
   * @returns {Object} the attributes
   */
  public get attributes(): Partial<Attrs> {
    return this.attributeState;
  }

  /**
   * @param {Object} values the attribute values to set
   */
  public set attributes(values: Partial<Attrs>) {
    Object.keys(values).forEach((attributeKey: keyof Attrs) => {
      Object.assign(this, { [attributeKey]: values[attributeKey] });
      this.attributeState[attributeKey] = values[attributeKey];
    });
  }

  /**
   * @returns {BaseJsonSchema} provides the JSON schema to validate the entity by
   */
  static schema(): BaseJsonSchema {
    throw new Error('An entity should provide its own schema');
  }

  /**
   * Instantiates and validates an entity
   *
   * @param {Object} attributes the entity's attributes
   * @returns {BaseEntity} the validated entity instance
   */
  static factory<T extends BaseEntity>(
    this: BaseEntityConstructor<T>, attributes: EntityAttributes = {}, ...args: any[]
  ): T {
    const entity = new this(...args);
    entity.attributes = validate(attributes, this.schemaId);
    return entity;
  }
}

export default Entity;
