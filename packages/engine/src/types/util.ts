export type ConstructorOf<T> = Function & { new(...args: any[]): T };
export type FactoryOf<T> = { factory(...args: any[]): T; }
export type AbstractConstructorOf<T = {}> = abstract new (...args: any[]) => T;
export type ValueOf<T> = T[keyof T];
export type ChoiceOf<T> = T[keyof T];
export type OneOf<T extends ReadonlyArray<unknown>> = T extends ReadonlyArray<infer OneOf> ? OneOf : never;
export type Diff<T, U> = Pick<T, Exclude<keyof T, keyof U>>;
export type RequireKeys<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
