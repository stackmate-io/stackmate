declare global {
  namespace jest {
    interface Matchers<R> {
      toThrowValidationError(expected: string | { key: string; message: string }): R
    }
  }
}

export {};
