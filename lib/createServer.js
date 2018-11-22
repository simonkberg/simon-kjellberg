// @flow strict

'use strict'

const http = require('http')
const path = require('path')
const express = require('express')
const compression = require('compression')
const helmet = require('helmet')
const morgan = require('morgan')
const favicon = require('serve-favicon')
const { ApolloServer } = require('apollo-server-express')
const graphqlSchema = require('./graphql/schema')
const createLoaders = require('./graphql/createLoaders')
const session = require('./session')
const randomName = require('./randomName')
const fragmentTypes = require('./fragmentTypes')
const nowRedirects = require('./nowRedirects')
const nowRobots = require('./nowRobots')

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
    playground: dev,
    debug: dev,
  })

  await app.prepare()

  server.set('trust proxy', 1)
  server.use(favicon(path.join(__dirname, '..', 'public', 'favicon.ico')))
  server.use(morgan(dev ? 'dev' : 'combined'))
  server.use(nowRedirects)
  server.use(nowRobots)

  if (!dev) {
    server.use(helmet())
  }

  server.use(compression())
  server.use(fragmentTypes(graphqlSchema))
  server.use(
    express.static(path.join(__dirname, '..', 'public'), { maxAge: '7d' })
  )
  server.use(
    '/_next/static/assets',
    express.static(path.join(__dirname, '..', '.next/static/assets'), {
      maxAge: '1y',
      immutable: true,
    })
  )

  server.use(
    '/graphql',
    session({
      secret,
      resave: false,
      saveUninitialized: false,
      cookie: { secure: 'auto' },
    }),
    (req /*: Request */, res /*: Response */, next /*: NextFunction */) => {
      if (!req.session.username) {
        req.session.username = randomName()
      }

      next()
    }
  )

  apolloServer.applyMiddleware({ app: server })

  server.get('*', (req /*: Request */, res /*: Response */) => {
    const url = new URL(req.url, `${req.protocol}://${req.hostname}`)
    const { pathname } = url

    if (pathname === '/service-worker.js') {
      const filePath = path.join(__dirname, '..', '.next', pathname)

      app.serveStatic(req, res, filePath)
    } else {
      handle(req, res, url)
    }
  })

  const httpServer = http.createServer(server)

  apolloServer.installSubscriptionHandlers(httpServer)

  return httpServer
}
