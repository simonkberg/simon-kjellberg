import raf from 'raf'

export default function animationFrame(fn) {
  const frame = {
    id: 0,
    cancel() {
      raf.cancel(this.id)
    },
  }

  const cb = ts => {
    frame.id = fn(ts, frame) && raf(cb)
  }

  frame.id = raf(cb)

  return frame
}

/**
 * Stop running frame after 3 seconds:
 *
 * ´´´
 *   let counter = 0
 *   let frame = animationFrame(() => {
 *     console.log('animationFrame', counter)
 *
 *     return ++counter
 *   })
 *
 *   setTimeout(() => {
 *     frame.cancel()
 *     console.log(frame)
 *   }, 3000)
 * ```
 *
 * Stop from inside frame:
 *
 * ```
 *   let counter = 0
 *
 *   animationFrame(() => {
 *     console.log('animationFrame', counter)
 *
 *     return ++counter < 100
 *   })
 * ```
 */
