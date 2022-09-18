export type Fn = (a: any) => any;
export type Obj = Record<string, any>;
export type ArrowFunc = (...args: any[]) => any;
export type MinMax = { min?: number, max?: number };
export type ChoiceOf<T> = T[keyof T];
export type OneOf<T extends ReadonlyArray<unknown>> = T extends ReadonlyArray<infer OneOf> ? OneOf : never;
export type RequireKeys<T, K extends keyof T> = Partial<T> & Required<Pick<T, K>>;
export type OmitNever<T> = { [K in keyof T as T[K] extends never ? never : K]: T[K] }
export type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
export type Either<T, U> = (T | U) extends object
  ? (Without<T, U> & U) | (Without<U, T> & T)
  : (T | U);
export type OneOfType<T extends unknown[]> = T extends [infer P1, infer P2]
  ? Either<P1, P2>
  : T extends [infer Only, ...infer Rest]
  ? Either<Only, OneOfType<Rest>>
  : never;
