/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */

module.exports = {
  clearMocks: true,
  preset: 'ts-jest',
  testEnvironment: 'node',
  globals: {
    "ts-jest": {
      "tsconfig": "tsconfig.json",
      "diagnostics": true
    }
  },
  transform: {
    "^.+\\.ts$": "ts-jest"
  },
  moduleNameMapper: {
    "@stackmate/(.*)": "<rootDir>/src/$1"
  },
  moduleFileExtensions: [
    "ts",
    "js"
  ],
  setupFilesAfterEnv: ['./jest.setup.js'],
};
