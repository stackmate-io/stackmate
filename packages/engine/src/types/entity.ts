import { ConstructorOf } from '@stackmate/engine/types/util';

/**
 * These two types sole pupose is for us to be able to distinguish attributes
 * from plain type properties. Any entity attributes should be wrapped into
 * the Attribute generic in order to be incorporated into the entity's schema etc
 */
declare const internalID: unique symbol;
export type Attribute<T> = T & { [internalID]: T };

export type ExtractBaseAttributeType<T> = T extends Attribute<infer X> ? X : never
export type AttributesOf<T> = { [K in keyof T as ExtractBaseAttributeType<T[K]> extends never ? never : K]: ExtractBaseAttributeType<T[K]> };
export type NonAttributesOf<T> = { [K in keyof T as ExtractBaseAttributeType<T[K]> extends never ? K : never]: T[K] };
export type EntityTypeOf<T> = AttributesOf<T> & NonAttributesOf<T>;
export type EntityAttributes = { [name: string]: any; }
export type ValidationErrorList = { [attribute: string]: Array<string>; };

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
