'use strict'

const codePointsToString = codePoints => {
  if (codePoints.includes('-')) {
    return codePoints.split('-').map(codePointsToString).join('')
  }

  const char = parseInt(codePoints, 16)

  if (char >= 0x10000 && char <= 0x10ffff) {
    const high = Math.floor((char - 0x10000) / 0x400) + 0xd800
    const low = ((char - 0x10000) % 0x400) + 0xdc00

    return String.fromCharCode(high) + String.fromCharCode(low)
  }

  return String.fromCharCode(char)
}

module.exports = codePointsToString
