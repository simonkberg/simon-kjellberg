'use strict'

module.exports = {
  setupTestFrameworkScriptFile: '<rootDir>/jest.setup.js',
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  transform: {
    '^.+\\.js$': 'babel-jest',
    '^.+\\.(woff2?|ico)$': '<rootDir>/jest/fileTransformer.js',
  },
}
