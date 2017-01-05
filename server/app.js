const path = require('path')
const logger = require('morgan')
const express = require('express')
const favicon = require('serve-favicon')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const compression = require('compression')
const expressWebpackAssets = require('express-webpack-assets')
const Immutable = require('immutable')
const webpackConfig = require('../webpack/config.client')
const reactServer = require('../build/server').default
const api = require('./api')

module.exports = function appServer ({ nr }) {
  const app = express()
  const dev = app.get('env') !== 'production'

  // middleware setup
  app.set('trust proxy', 'loopback')
  app.use(favicon(path.join(__dirname, '../static/favicon.ico')))
  app.use(logger('dev'))
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(cookieParser())
  app.use(compression())
  app.use(express.static(path.join(__dirname, '../static'), { maxAge: '7 days' }))
  app.use(express.static(path.join(__dirname, '../build'), { maxAge: '1 year' }))

  // api
  app.use('/api', api)

  // edgy
  app.use((req, res, next) => {
    res.header('X-UA-Compatible', 'IE=edge')

    next()
  })

  // set newrelic local
  app.use((req, res, next) => {
    res.locals.newrelic = nr

    next()
  })

  // set server store
  app.use((req, res, next) => {
    res.locals.state = Immutable.fromJS({
      app: { baseUrl: `${req.protocol}://${req.get('host')}` },
    })

    next()
  })

  const manifest = path.join(__dirname, '../build/manifest.json')

  app.use(expressWebpackAssets(manifest, { devMode: dev }))

  if (dev) {
    const debug = require('debug')
    const webpack = require('webpack')
    const webpackDevMiddleware = require('webpack-dev-middleware')
    const webpackHotMiddleware = require('webpack-hot-middleware')
    const config = webpackConfig()
    const compiler = webpack(config)
    const log = debug('sk:app')

    app.use(webpackDevMiddleware(compiler, {
      noInfo: true,
      publicPath: config.output.publicPath,
      stats: {
        colors: true,
      },
    }))

    app.use(webpackHotMiddleware(compiler, { log }))
  }

  app.use(reactServer())

  return app
}
