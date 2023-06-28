'use strict'

const http = require('http')
const path = require('path')
const url = require('url')
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

module.exports = async (app, opts = {}) => {
  const dev = process.env.NODE_ENV !== 'production'
  const keys = [
    process.env.SESSION_KEY_PRIMARY || 'unsafe_session_key1',
    process.env.SESSION_KEY_SECONDARY || 'unsafe_session_key2',
  ]
  const server = express()
  const handle = app.getRequestHandler()
  const apolloServer = new ApolloServer({
    schema: graphqlSchema,
    context: ctx => ({
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

  if (opts.newrelic != null) {
    server.use(function newrelic(req, res, next) {
      req.newrelic = opts.newrelic
      next()
    })
  }

  if (!dev) {
    server.use(helmet({
      contentSecurityPolicy: false,
    }))
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
    function sessionUsername(req, res, next) {
      if (!req.session.username) {
        req.session.username = randomName()
      }

      next()
    }
  )

  apolloServer.applyMiddleware({ app: server })

  server.get('*', function nextjs(req, res) {
    // next.js still depends on the deprecated format
    // eslint-disable-next-line node/no-deprecated-api
    const parsedUrl = url.parse(req.url, true)
    const { pathname } = parsedUrl

    if (/^\/(service-worker|precache-manifest\.[\w]+)\.js$/.test(pathname)) {
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
