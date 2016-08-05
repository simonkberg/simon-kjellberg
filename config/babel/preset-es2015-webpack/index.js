const basePreset = require('babel-preset-es2015')
const commonJsPlugin = require('babel-plugin-transform-es2015-modules-commonjs')

const plugins = basePreset.plugins.filter(plugin => {
  return (Array.isArray(plugin) ? plugin[0] : plugin) !== commonJsPlugin
})

module.exports = Object.assign(basePreset, { plugins })
