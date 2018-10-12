'use strict'

const bsconfig = require('./bsconfig')

const transformModules = [...bsconfig['bs-dependencies'], 'bs-platform']

module.exports = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  transformIgnorePatterns: [
    `<rootDir>/node_modules/(?!(${transformModules.join('|')})/)`,
  ],
  transform: {
    '^.+\\.js$': '<rootDir>/jest/babelTransformer.js',
    '^.+\\.(woff2?|ico)$': '<rootDir>/jest/fileTransformer.js',
  },
  snapshotSerializers: ['jest-emotion'],
}
