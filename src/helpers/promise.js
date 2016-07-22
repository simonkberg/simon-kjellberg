function delay (time) {
  return new Promise(resolve => setTimeout(resolve, time))
}

export function timeout (promise, time) {
  return Promise.race([
    delay(time).then(() => {
      throw new Error('Operation timed out')
    }),
    promise,
  ])
}
