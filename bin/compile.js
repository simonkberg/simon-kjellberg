'use strict'

require('dotenv').load({ silent: true })

const debug = require('debug')
const del = require('del')
const path = require('path')
const webpack = require('webpack')
const webpackConfig = require('../webpack.config')()

const log = debug('sk:compile')
const compiler = webpack(webpackConfig)
const build = path.join(__dirname, '../build')

// clean build folder
del.sync(path.join(build, '**'))

// compile project
compiler.run((err, stats) => {
  if (err) throw err

  const output = stats.toString({
    chunks: false,
    colors: process.stdout.isTTY,
  })

  if (stats.hasErrors()) {
    log(output)
    process.exit(1)
  } else if (stats.hasWarnings()) {
    log(output)
  } else {
    log(output)
  }
})