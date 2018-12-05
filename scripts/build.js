// @flow strict

'use strict'

require('dotenv').config()

process.env.NODE_ENV = 'production'

const fs = require('fs-extra')
const path = require('path')
const minimist = require('minimist')
const build = require('next/dist/build').default
const graphql = require('graphql')
const getFragmentTypes = require('../lib/getFragmentTypes')
const config = require('../app.config')

/*::
export type Options = {
  lambdas: boolean,
  schemaPath: string,
  fragmentTypesPath: string,
}
*/

const argv = minimist(process.argv.slice(2), {
  alias: {
    lambdas: 'l',
    schemaPath: 'schema-path',
    fragmentTypesPath: 'fragment-types-path',
  },
  boolean: ['lambdas'],
  default: {
    schemaPath: path.resolve(config.lib, 'graphql/schema.graphql'),
    fragmentTypesPath: path.resolve(config.dest, 'fragmentTypes.json'),
  },
})

const options = (fn /*: (opt: Options) => Promise<void> */) =>
  fn({
    lambdas: Boolean(argv.lambdas),
    schemaPath: String(argv.schemaPath),
    fragmentTypesPath: String(argv.fragmentTypesPath),
  }).catch(err => {
    console.error(err)
    process.exit(1)
  })

const extractFragmentTypes = async (schemaPath, fragmentTypesPath) => {
  const schemaContent = await fs.readFile(schemaPath, 'utf8')
  const schemaAst = graphql.parse(schemaContent)
  const schema = graphql.buildASTSchema(schemaAst)
  const fragmentTypes = await getFragmentTypes(schema)

  await fs.outputJson(fragmentTypesPath, fragmentTypes)
}

module.exports = options(async ({ lambdas, schemaPath, fragmentTypesPath }) => {
  await fs.remove(config.dest)
  await Promise.all([
    extractFragmentTypes(schemaPath, fragmentTypesPath),
    build(config.src, null, lambdas),
  ])

  process.exit(0)
})
