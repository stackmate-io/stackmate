import { ConstructorOf } from './util';

export interface EntityAttributes {
  [name: string]: any;
}

export type ValidationErrorList = {
  [attribute: string]: Array<string>;
};

export interface BaseEntity {
  get attributes(): EntityAttributes;
  set attributes(attrs: EntityAttributes);
  get attributeNames(): string[];
  validate(): void;
  getAttribute(name: string): any;
  setAttribute(name: string, value: any): void;
}

export interface BaseEntityConstructor<T extends BaseEntity> extends Function {
  prototype: T;
  new(...args: any[]): T;
  normalize(attributes: object): object;
  factory(this: ConstructorOf<T>, ...args: any[]): T;
}
