'use strict'

const DataLoader = require('dataloader')
const LRU = require('lru-cache')

module.exports = class LRUCacheDataLoader extends DataLoader {
  constructor(batchLoadFn, options = {}) {
    const { cacheOptions, ...dataLoaderOptions } = options
    const cache = new LRU(cacheOptions)

    super(batchLoadFn, {
      ...dataLoaderOptions,
      cacheMap: {
        get: key => cache.get(key),
        set: (key, value) => cache.set(key, value),
        delete: key => cache.del(key),
        clear: () => cache.reset(),
      },
    })
  }
}
