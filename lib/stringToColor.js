// @flow strict

'use strict'

const { toColorString } = require('polished')
const djb2hash = require('./djb2hash')

module.exports = function stringToColor(
  string /*: string */,
  saturation /*: number */ = 1,
  lightness /*: number */ = 0.4
) {
  return toColorString({
    hue: Math.abs(djb2hash(string)) % 360,
    saturation,
    lightness,
  })
}
