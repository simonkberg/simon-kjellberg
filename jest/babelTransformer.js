'use strict'

const path = require('path')

module.exports = require('babel-jest').createTransformer({
  babelrc: false,
  configFile: path.resolve(__dirname, '..', '.babelrc.js'),
})
