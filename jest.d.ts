declare global {
  namespace jest {
    interface Matchers<R> {
      toThrowValidationError(expected: string | { path: string; message: string }): R
    }
  }
}

export {}
