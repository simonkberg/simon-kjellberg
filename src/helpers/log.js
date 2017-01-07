import debug from 'debug'

const log = debug('sk:app')

if (__DEV__) {
  debug.enable(process.env.DEBUG)
} else {
  debug.disable()
}

export default log
