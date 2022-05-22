export type ConstructorOf<T> = Function & { new(...args: any[]): T; prototype: T };
export type FactoryOf<T> = { factory(...args: any[]): T; }
export type AbstractConstructorOf<T = {}> = abstract new (...args: any[]) => T;
export type ValueOf<T> = T[keyof T];
export type ChoiceOf<T> = T[keyof T];
export type OneOf<T extends ReadonlyArray<unknown>> = T extends ReadonlyArray<infer OneOf> ? OneOf : never;
export type ComplementOf<Base, T extends Base, K extends keyof Base = keyof Base> = Omit<T, K>;
export type Diff<T, U> = Pick<T, Extract<keyof T, keyof U>>;
export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequireKeys<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
export type OmitNever<T> = { [K in keyof T as T[K] extends never ? never : K]: T[K] }
export type IsExact<Left, Right> =(<U>() => U extends Left ? 1 : 0) extends (<U>() => U extends Right ? 1 : 0) ? true : false;
export type IfEquals<T, U, Y = unknown, N = never> = (<G>() => G extends T ? 1 : 2) extends (<G>() => G extends U ? 1 : 2) ? Y : N;
export type OmitProperties<T extends object, PropType> = { [K in keyof T]-?: T[K] extends PropType ? never : K }[keyof T];
export type FilteredKeys<T, U> = { [P in keyof T]: T[P] extends U ? P : never }[keyof T];
export type FilteredProperties<T, U> = { [K in FilteredKeys<T, U>]: T[K]; };
