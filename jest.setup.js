/* eslint-env jest */

'use strict'

const { createSerializer, createMatchers } = require('jest-emotion')
const emotion = require('emotion')
const { setConfig } = require('next/config')
const nextConfig = require('./next.config.js')

expect.addSnapshotSerializer(createSerializer(emotion))
expect.extend(createMatchers(emotion))

setConfig({
  serverRuntimeConfig: nextConfig.serverRuntimeConfig,
  publicRuntimeConfig: nextConfig.publicRuntimeConfig,
})
