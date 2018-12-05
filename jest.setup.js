/* eslint-env jest */

'use strict'

const { matchers } = require('jest-emotion')
const { setConfig } = require('next/config')
const nextConfig = require('./next.config.js')

expect.extend(matchers)

setConfig({
  serverRuntimeConfig: nextConfig.serverRuntimeConfig,
  publicRuntimeConfig: nextConfig.publicRuntimeConfig,
})
