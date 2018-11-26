// @flow strict

'use strict'

const http = require('http')
const path = require('path')
const ms = require('ms')
const express = require('express')
const compression = require('compression')
const helmet = require('helmet')
const morgan = require('morgan')
const favicon = require('serve-favicon')
const cookieSession = require('cookie-session')
const { ApolloServer } = require('apollo-server-express')
const config = require('../app.config')
const graphqlSchema = require('./graphql/schema')
const createLoaders = require('./graphql/createLoaders')
const randomName = require('./randomName')
const fragmentTypes = require('./fragmentTypes')
const nowRedirects = require('./nowRedirects')
const nowRobots = require('./nowRobots')

/*::
import next from 'next'
import type { NextFunction, $Request, $Response } from 'express'
import NewRelicAPI from 'newrelic'

type NextApp = $Call<next, { dev: boolean }>
type Request = $Subtype<$Request>
type Response = Response
type Context = { req?: Request, connection?: Object }
type Options = { newrelic?: typeof NewRelicAPI }
*/

module.exports = async (app /*: NextApp */, opts /*: Options */ = {}) => {
  const dev = process.env.NODE_ENV !== 'production'
  const keys = [
    process.env.SESSION_KEY_PRIMARY || 'unsafe_session_key1',
    process.env.SESSION_KEY_SECONDARY || 'unsafe_session_key2',
  ]
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

  if (opts.newrelic != null) {
    server.use(function newrelic(
      req /*: Request */,
      res /*: Response */,
      next /*: NextFunction */
    ) {
      req.newrelic = opts.newrelic
      next()
    })
  }

  if (!dev) {
    server.use(helmet())
  }

  server.use(compression())

  if (dev) {
    server.use(fragmentTypes({ schema: graphqlSchema }))
  } else {
    server.use(
      fragmentTypes({ path: path.resolve(config.dest, 'fragmentTypes.json') })
    )
  }

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
    cookieSession({
      keys,
      maxAge: ms('1y'),
    }),
    function sessionUsername(
      req /*: Request */,
      res /*: Response */,
      next /*: NextFunction */
    ) {
      if (!req.session.username) {
        req.session.username = randomName()
      }

      next()
    }
  )

  apolloServer.applyMiddleware({ app: server })

  server.get('*', function nextjs(req /*: Request */, res /*: Response */) {
    const url = new URL(req.url, `${req.protocol}://${req.hostname}`)
    const { pathname } = url

    if (/^\/(service-worker|precache-manifest\.[\w]+)\.js$/.test(pathname)) {
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
