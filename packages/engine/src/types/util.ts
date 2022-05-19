export type ConstructorOf<T> = Function & { new(...args: any[]): T };
export type FactoryOf<T> = { factory(...args: any[]): T; }
export type AbstractConstructorOf<T = {}> = abstract new (...args: any[]) => T;
export type ValueOf<T> = T[keyof T];
export type ChoiceOf<T> = T[keyof T];
export type OneOf<T extends ReadonlyArray<unknown>> = T extends ReadonlyArray<infer OneOf> ? OneOf : never;
export type ComplementOf<Base, T extends Base, K extends keyof Base = keyof Base> = Omit<T, K>;
export type Diff<T, U> = Pick<T, Extract<keyof T, keyof U>>;
export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequireKeys<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
export type OmitProperties<T extends object, PropType> = {
  [K in keyof T]-?: T[K] extends PropType ? never : K
}[keyof T];
