// @flow strict

'use strict'

const http = require('http')
const url = require('url')
const path = require('path')
const express = require('express')
const compression = require('compression')
const helmet = require('helmet')
const morgan = require('morgan')
const { ApolloServer } = require('apollo-server-express')
const graphqlSchema = require('./graphql/schema')
const createLoaders = require('./graphql/createLoaders')
const session = require('./utils/session')
const randomName = require('./utils/randomName')
const fragmentTypes = require('./utils/fragmentTypes')
const nowRedirects = require('./utils/nowRedirects')
const nowRobots = require('./utils/nowRobots')

/*::
import next from 'next'
import type { NextFunction, $Request, $Response } from 'express'

type NextApp = $Call<next, { dev: boolean }>
type Request = $Subtype<$Request>
type Response = Response
type Context = { req?: Request, connection?: Object }
*/

module.exports = async (app /*: NextApp */) => {
  const dev = process.env.NODE_ENV !== 'production'
  const secret = process.env.SESSION_KEY || 'unsafe_session_key'
  const server = express()
  const handle = app.getRequestHandler()
  const apolloServer = new ApolloServer({
    schema: graphqlSchema,
    context: (ctx /*: Context */) => ({
      session: ctx.req ? ctx.req.session : null,
      loaders: createLoaders(ctx),
    }),
  })

  await app.prepare()

  server.set('trust proxy', 1)
  server.use(morgan(dev ? 'dev' : 'default'))
  server.use(nowRedirects)
  server.use(nowRobots)

  if (!dev) {
    server.use(helmet())
  }

  server.use(session({ secret, resave: false, saveUninitialized: false }))
  server.use(compression())
  server.use(fragmentTypes(graphqlSchema))
  server.use(express.static(path.resolve(__dirname, '..', 'public')))

  server.use((
    req /*: Request */,
    res /*: Response */,
    next /*: NextFunction */
  ) => {
    if (!req.session.username) {
      req.session.username = randomName()
    }

    next()
  })

  apolloServer.applyMiddleware({ app: server })

  server.get('*', (req /*: Request */, res /*: Response */) => {
    const parsedUrl = url.parse(req.url, true)
    const { pathname } = parsedUrl

    if (pathname === '/service-worker.js') {
      const filePath = path.join(__dirname, '..', '.next', pathname)

      app.serveStatic(req, res, filePath)
    } else {
      handle(req, res, parsedUrl)
    }
  })

  const httpServer = http.createServer(server)

  apolloServer.installSubscriptionHandlers(httpServer)

  return httpServer
}
