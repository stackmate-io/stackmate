/**
 * @link https://github.com/sindresorhus/type-fest/blob/main/source/entry.d.ts
 * @link https://catchts.com/FP-style
 */
type MapKey<BaseType> = BaseType extends Map<infer KeyType, unknown> ? KeyType : never;
type MapValue<BaseType> = BaseType extends Map<unknown, infer ValueType> ? ValueType : never;
export type ArrayEntry<BaseType extends readonly unknown[]> = [number, BaseType[number]];
export type MapEntry<BaseType> = [MapKey<BaseType>, MapValue<BaseType>];
export type ObjectEntry<BaseType> = [keyof BaseType, BaseType[keyof BaseType]];
export type SetEntry<BaseType> = BaseType extends Set<infer ItemType> ? [ItemType, ItemType] : never;
export type Entry<BaseType> =
  BaseType extends Map<unknown, unknown> ? MapEntry<BaseType>
  : BaseType extends Set<unknown> ? SetEntry<BaseType>
  : BaseType extends readonly unknown[] ? ArrayEntry<BaseType>
  : BaseType extends object ? ObjectEntry<BaseType>
  : never;
export type Fn = (a: any) => any;
export type Obj = Record<string, any>;
export type ConstructorOf<T> = Function & { new(...args: any[]): T; prototype: T };
export type FactoryOf<T> = { factory(...args: any[]): T; }
export type AbstractConstructorOf<T = {}> = abstract new (...args: any[]) => T;
export type ValueOf<T> = T[keyof T];
export type ChoiceOf<T> = T[keyof T];
export type OneOf<T extends ReadonlyArray<unknown>> = T extends ReadonlyArray<infer OneOf> ? OneOf : never;
export type ComplementOf<Base, T extends Base, K extends keyof Base = keyof Base> = Omit<T, K>;
export type Diff<T, U> = Pick<T, Extract<keyof T, keyof U>>;
export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequireKeys<T, K extends keyof T> = Partial<T> & Required<Pick<T, K>>;
export type OmitNever<T> = { [K in keyof T as T[K] extends never ? never : K]: T[K] }
export type IsExact<Left, Right> =(<U>() => U extends Left ? 1 : 0) extends (<U>() => U extends Right ? 1 : 0) ? true : false;
export type IfEquals<T, U, Y = unknown, N = never> = (<G>() => G extends T ? 1 : 2) extends (<G>() => G extends U ? 1 : 2) ? Y : N;
export type OmitProperties<T extends object, PropType> = { [K in keyof T]-?: T[K] extends PropType ? never : K }[keyof T];
export type FilteredKeys<T, U> = { [P in keyof T]: T[P] extends U ? P : never }[keyof T];
export type FilteredProperties<T, U> = { [K in FilteredKeys<T, U>]: T[K]; };
export type OptionalPropertiesOf<T extends object> = OmitNever<Exclude<{ [K in keyof T]: T extends Record<K, T[K]> ? never : K }, undefined>>;
export type RecursivePartial<T> = { [P in keyof T]?: RecursivePartial<T[P]> };
export type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
export type Either<T, U> = (T | U) extends object ? (Without<T, U> & U) | (Without<U, T> & T) : (T | U);
export type OneOfType<T extends unknown[]> = T extends [infer P1, infer P2] ? Either<P1, P2> : T extends [infer Only, ...infer Rest] ? Either<Only, OneOfType<Rest>> : never;
export type Head<T extends any[]> = T extends [infer H, ...infer _] ? H : never;
export type Last<T extends any[]> = T extends [infer _] ? never : T extends [...infer _, infer Tl] ? Tl : never;
export type FirstParameterOf<T extends Fn[]> = Head<T> extends Fn ? Head<Parameters<Head<T>>> : never;
export type LastParameterOf<T extends Fn[]> = Last<T> extends Fn ? Head<Parameters<Last<T>>> : never;
export type MinMax = { min?: number, max?: number };
export type ArrowFunc = (...args: any[]) => any;
