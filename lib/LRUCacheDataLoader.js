// @flow

'use strict'

const DataLoader = require('dataloader')
const LRU = require('lru-cache')

/*::
import type { BatchLoadFn, Options as DataLoaderOptions } from 'dataloader'
import type { Options as LRUCacheOptions } from 'lru-cache'

type Options<K, V> = DataLoaderOptions<K, V> & {
  cacheOptions?: LRUCacheOptions<K, V>,
}
*/

module.exports = class LRUCacheDataLoader /*:: <K, V> */ extends DataLoader /*:: <K,V> */ {
  constructor(
    batchLoadFn /*: BatchLoadFn<K, V> */,
    options /*: Options<K, V> */ = {}
  ) {
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
