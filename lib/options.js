// @flow strict

require('dotenv').config()

/*::
export type Options = {
  port: number,
  host: string,
}
*/

const minimist = require('minimist')

const argv = minimist(process.argv.slice(2), {
  alias: {
    host: 'h',
    port: 'p',
  },
  default: {
    host: process.env.HOST || '0.0.0.0',
    port: parseInt(process.env.PORT, 10) || 3000,
  },
})

const options = (fn /*: (opt: Options) => Promise<void> */) =>
  fn({
    host: String(argv.host),
    port: parseInt(argv.port, 10),
  }).catch(err => {
    console.error(err)
    process.exit(1)
  })

module.exports = options
