/* eslint-env jest */

'use strict'

const { matchers } = require('jest-emotion')
const { createSerializer, createMatchers } = require('jest-emotion-v9')
const emotion = require('emotion-v9')
const { setConfig } = require('next/config')
const nextConfig = require('./next.config.js')

expect.extend(matchers)
expect.extend(createMatchers(emotion))
expect.addSnapshotSerializer(createSerializer(emotion))

setConfig({
  serverRuntimeConfig: nextConfig.serverRuntimeConfig,
  publicRuntimeConfig: nextConfig.publicRuntimeConfig,
})
