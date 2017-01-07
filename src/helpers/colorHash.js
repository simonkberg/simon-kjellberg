
const cache = new Map()

const charToCharCode = s => s.charCodeAt(0)
const hashReducer = (a, c) => ((a << 5) + a) ^ c

export function hashString (string) {
  if (!string.length) return 0

  if (cache.has(string)) {
    return cache.get(string)
  }

  const hash = string
    .split('')
    .map(charToCharCode)
    .reduce(hashReducer, 5381)

  cache.set(string, hash)

  return hash
}

export default function colorHash (string, saturation = 100, lightness = 40) {
  const hue = Math.abs(hashString(string))

  return `hsl(${hue % 360}, ${saturation}%, ${lightness}%)`
}
