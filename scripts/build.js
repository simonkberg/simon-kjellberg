// @flow strict

'use strict'

require('dotenv').config()

process.env.NODE_ENV = 'production'

const fs = require('fs-extra')
const path = require('path')
const minimist = require('minimist')
const build = require('next/dist/build').default
const graphqlSchema = require('../lib/graphql/schema')
const getFragmentTypes = require('../lib/getFragmentTypes')
const config = require('../app.config')

/*::
export type Options = {
  lambdas: boolean,
  fragmentTypesPath: string,
}
*/

const argv = minimist(process.argv.slice(2), {
  alias: { lambdas: 'l', fragmentTypesPath: 'fragment-types-path' },
  boolean: ['lambdas'],
  default: {
    fragmentTypesPath: path.resolve(config.dest, 'fragmentTypes.json'),
  },
})

const options = (fn /*: (opt: Options) => Promise<void> */) =>
  fn({
    lambdas: Boolean(argv.lambdas),
    fragmentTypesPath: String(argv.fragmentTypesPath),
  }).catch(err => {
    console.error(err)
    process.exit(1)
  })

const extractFragmentTypes = async fragmentTypesPath => {
  const fragmentTypes = await getFragmentTypes(graphqlSchema)
  await fs.outputJson(fragmentTypesPath, fragmentTypes)
}

module.exports = options(async ({ lambdas, fragmentTypesPath }) => {
  await fs.remove(config.dest)
  await Promise.all([
    extractFragmentTypes(fragmentTypesPath),
    build(config.src, null, lambdas),
  ])

  process.exit(0)
})
