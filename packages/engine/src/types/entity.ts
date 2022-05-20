import { ConstructorOf, IsExact, OmitNever } from './util';

/**
 * These two types sole pupose is for us to be able to distinguish attributes
 * from plain type properties. Any entity attributes should be wrapped into
 * the Attribute generic in order to be incorporated into the entity's schema etc
 */
export type Attr = {}
export type Attribute<T> = T & Attr;
export type EntityAttributes = { [name: string]: Attr; }
export type ValidationErrorList = { [attribute: string]: Array<string>; };
export type IsAttribute<T> = IsExact<T, Attribute<T>>;
export type AttributesOf<T> = OmitNever<{ [K in keyof T]-?: IsAttribute<T[K]> extends true ? T[K] extends Function ? never : T[K] : never }>

export interface BaseEntity {
  get attributes(): EntityAttributes;
  set attributes(attrs: EntityAttributes);
  get attributeNames(): string[];
  validate(): void;
}

export interface BaseEntityConstructor<T extends BaseEntity> extends Function {
  prototype: T;
  new(...args: any[]): T;
  normalize(attributes: EntityAttributes): EntityAttributes;
  factory(this: ConstructorOf<T>, ...args: any[]): T;
}
