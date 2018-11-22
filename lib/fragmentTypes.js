// @flow strict

'use strict'

const fs = require('fs')
const util = require('util')
const getFragmentTypes = require('./getFragmentTypes')

const readFile = util.promisify(fs.readFile)

/*::
import type { GraphQLSchema } from 'graphql'
import type { Middleware, $Request, $Response, NextFunction } from 'express'

type Request = $Subtype<$Request>
type Response = $Response
type Options = { schema?: GraphQLSchema, path?: string }
*/

const fragmentTypes = (opts /*: Options */) /*: Middleware */ => async (
  req /*: Request */,
  res /*: Response */,
  next /*: NextFunction */
) => {
  try {
    if (opts.schema != null) {
      req.fragmentTypes = await getFragmentTypes(opts.schema)
    } else if (opts.path != null) {
      const file = await readFile(opts.path, 'utf8')
      req.fragmentTypes = JSON.parse(file)
    } else {
      throw new Error(
        '[fragmentTypes] Invalid options: provide either a `schema` or `path`.'
      )
    }
  } catch (err) {
    next(err)
  }

  next()
}

module.exports = fragmentTypes
