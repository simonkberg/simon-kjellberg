// @flow strict

'use strict'

const fetch = require('cross-fetch')
const DataLoader = require('dataloader')
const LRUCacheDataLoader = require('../utils/LRUCacheDataLoader')
const slack = require('../slack')
const sortByTS = require('../utils/sortByTS')

// global instance for shared cache
const wakaTimeLoader = new LRUCacheDataLoader(
  urls =>
    Promise.all(
      urls.map(async url => {
        const response = await fetch(url)
        const json = await response.json()

        return json.data
      })
    ),
  { maxAge: 1000 * 60 * 60 }
)

// global instance for shared cache
const userLoader = new LRUCacheDataLoader(
  async keys =>
    Promise.all(
      keys.map(async user => {
        const response = await slack.client.users.info({ user })
        return response.user
      })
    ),
  { cacheOptions: { max: 100, maxAge: 1000 * 60 * 60 } }
)

/*::
import type { $Request } from 'express'

type Request = $Subtype<$Request>
type Context = { req?: Request, connection?: Object }
export type Loaders = $Call<typeof createLoaders, Context>
*/

const createLoaders = (ctx /*: Context */) => {
  const repliesLoader = new DataLoader(threads =>
    Promise.all(
      threads.map(async ts => {
        const response = await slack.client.im.replies({
          channel: slack.channel,
          thread_ts: ts,
        })

        return response.messages
          .filter(message => message.ts !== ts)
          .sort(sortByTS)
      })
    )
  )

  const historyLoader = new DataLoader(channels =>
    Promise.all(
      channels.map(async channel => {
        const response = await slack.client.im.history({ channel })

        response.messages.forEach(message => {
          if (message.thread_ts === message.ts) {
            repliesLoader.prime(
              message.ts,
              response.messages
                .filter(
                  reply =>
                    reply.thread_ts === message.ts && reply.ts !== message.ts
                )
                .sort(sortByTS)
            )
          }
        })

        return response.messages
          .filter(
            message =>
              message.thread_ts == null || message.thread_ts === message.ts
          )
          .sort(sortByTS)
      })
    )
  )

  return {
    wakaTime: wakaTimeLoader,
    user: userLoader,
    history: historyLoader,
    replies: repliesLoader,
  }
}

module.exports = createLoaders