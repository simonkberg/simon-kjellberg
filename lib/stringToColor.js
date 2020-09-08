'use strict'

const { toColorString } = require('polished')
const djb2hash = require('./djb2hash')

module.exports = function stringToColor(
  string,
  saturation = 1,
  lightness = 0.6
) {
  return toColorString({
    hue: Math.abs(djb2hash(string)) % 360,
    saturation,
    lightness,
  })
}
