'use strict'

const { PerformanceObserver, performance } = require('perf_hooks')
const util = require('util')

const debug = util.debuglog('perf')

const perfObserver = new PerformanceObserver(items => {
  items
    .getEntries()
    .forEach(({ entryType, name, duration }) =>
      debug(`[${entryType}] ${name}: ${duration}ms`)
    )

  performance.clearMarks()
})

perfObserver.observe({ entryTypes: ['measure'] })

module.exports = performance
