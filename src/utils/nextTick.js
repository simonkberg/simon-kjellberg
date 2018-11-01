// @flow strict

const nextTick = (fn: () => void) =>
  typeof process === 'object' && typeof process.nextTick === 'function'
    ? process.nextTick(fn)
    : Promise.resolve().then(fn)

export default nextTick
