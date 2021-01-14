'use strict'

const DataLoader = require('dataloader')
const LRUCacheDataLoader = require('../LRUCacheDataLoader')
const jsonCache = require('../jsonCache')
const slack = require('../slack')

const sortByTS = (a, b) => parseInt(a.ts, 10) - parseInt(b.ts, 10)
const flattenSettled = values =>
  values.map(({ value, reason }) => value ?? reason)

// global instance for shared cache
const wakaTimeLoader = new LRUCacheDataLoader(
  urls =>
    Promise.allSettled(
      urls.map(async url => {
        const json = await jsonCache(url, 60 * 60 * 12)
        return json.data
      })
    ).then(flattenSettled),
  { maxAge: 1000 * 60 * 60 * 12 }
)

// global instance for shared cache
const userLoader = new LRUCacheDataLoader(
  keys =>
    Promise.allSettled(
      keys.map(async user => {
        const response = await slack.client.users.info({ user })
        return response.user
      })
    ).then(flattenSettled),
  { cacheOptions: { max: 100, maxAge: 1000 * 60 * 60 } }
)

const createLoaders = ctx => {
  const repliesLoader = new DataLoader(threads =>
    Promise.allSettled(
      threads.map(async ts => {
        const response = await slack.client.conversations.replies({
          channel: slack.channel,
          ts,
        })
        return response.messages
          .filter(message => message.ts !== ts)
          .sort(sortByTS)
      })
    ).then(flattenSettled)
  )

  const historyLoader = new DataLoader(channels =>
    Promise.allSettled(
      channels.map(async channel => {
        const response = await slack.client.conversations.history({ channel })
        return response.messages.sort(sortByTS)
      })
    ).then(flattenSettled)
  )

  return {
    wakaTime: wakaTimeLoader,
    user: userLoader,
    history: historyLoader,
    replies: repliesLoader,
  }
}

module.exports = createLoaders
