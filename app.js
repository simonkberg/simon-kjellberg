import path from 'path'
import logger from 'morgan'
import express from 'express'
import favicon from 'serve-favicon'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import compression from 'compression'
import expressWebpackAssets from 'express-webpack-assets'
import webpackConfig from './webpack/config.client'
import reactServer from './build/server'
import api from './api'

module.exports = (nr = null) => {
  const app = express()
  const dev = app.get('env') !== 'production'

  // middleware setup
  app.set('trust proxy', 'loopback')
  app.use(favicon(path.join(__dirname, 'static/favicon.ico')))
  app.use(logger('dev'))
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(cookieParser())
  app.use(compression())
  app.use(express.static(path.join(__dirname, 'static')))
  app.use(express.static(path.join(__dirname, 'build')))

  // api
  app.use('/api', api)
  // redirect old slack hooks
  app.use('/slack/:method', (req, res) => {
    return res.redirect(307, `/api/slack/${req.params.method}`)
  })

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
    res.locals.data = {
      app: {
        baseUrl: `${req.protocol}://${req.get('host')}`
      }
    }

    next()
  })

  const manifest = path.join(__dirname, 'build/manifest.json')

  app.use(expressWebpackAssets(manifest, { devMode: dev }))

  if (dev) {
    const webpack = require('webpack')
    const webpackDevMiddleware = require('webpack-dev-middleware')
    const webpackHotMiddleware = require('webpack-hot-middleware')
    const config = webpackConfig()
    const compiler = webpack(config)

    app.use(webpackDevMiddleware(compiler, {
      noInfo: true,
      publicPath: config.output.publicPath,
      stats: {
        colors: true
      }
    }))

    app.use(webpackHotMiddleware(compiler))
  }

  app.use(reactServer())

  return app
}
