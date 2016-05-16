
const cache = new Map()

export function hashString (string) {
  if (!string.length) return 0

  if (cache.has(string)) {
    return cache.get(string)
  }

  let hash = 0

  for (let char of string) {
    hash = char.charCodeAt() + ((hash << 5) - hash)
    hash = hash & hash // Convert to 32bit integer
  }

  cache.set(string, hash)

  return hash
}

export default function colorHash (string, saturation = 100, lightness = 30) {
  const hue = hashString(string)

  return `hsl(${hue % 360}, ${saturation}%, ${lightness}%)`
}
