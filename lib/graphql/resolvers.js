// @flow strict

'use strict'

const stringToColor = require('../stringToColor')
const messageParser = require('../slack/messageParser')
const slack = require('../slack')
const { pubSub, ...pubSubTypes } = require('./pubSub')

const JSON_STATS =
  'https://wakatime.com/@simonkberg/4a1baa98-ab8f-436e-ada0-8810ef941f76.json'
const JSON_ACTIVITY =
  'https://wakatime.com/@simonkberg/bb9d21e6-a93d-4f64-b741-8a3f0b032fce.json'

/*::
import type { Loaders } from './createLoaders'
import * as Schema from './schema.graphql.js'

type Context = { loaders: Loaders, session: $FlowFixMe }
*/

module.exports = {
  Subscription: {
    chatMessageAdded: {
      subscribe: () => pubSub.asyncIterator([pubSubTypes.CHAT_MESSAGE_ADDED]),
      resolve(
        { chatMessageAdded } /*: Schema.Subscription */,
        args /*: {} */,
        { loaders } /*: Context */
      ) {
        const { chatMessage } = chatMessageAdded

        loaders.history.clearAll()
        loaders.replies.clear(
          chatMessage.thread_ts == null ||
          chatMessage.thread_ts === chatMessage.ts
            ? chatMessage.ts
            : chatMessage.thread_ts
        )

        return chatMessageAdded
      },
    },
    chatMessageEdited: {
      subscribe: () => pubSub.asyncIterator([pubSubTypes.CHAT_MESSAGE_EDITED]),
      resolve(
        { chatMessageEdited } /*: Schema.Subscription */,
        args /*: {} */,
        { loaders } /*: Context */
      ) {
        const { chatMessage } = chatMessageEdited

        loaders.history.clearAll()
        loaders.replies.clear(
          chatMessage.thread_ts == null ||
          chatMessage.thread_ts === chatMessage.ts
            ? chatMessage.ts
            : chatMessage.thread_ts
        )

        return chatMessageEdited
      },
    },
    chatMessageDeleted: {
      subscribe: () => pubSub.asyncIterator([pubSubTypes.CHAT_MESSAGE_DELETED]),
      resolve(
        { chatMessageDeleted } /*: Schema.Subscription */,
        args /*: {} */,
        { loaders } /*: Context */
      ) {
        const { chatMessage } = chatMessageDeleted

        loaders.history.clearAll()
        loaders.replies.clear(
          chatMessage.thread_ts == null ||
          chatMessage.thread_ts === chatMessage.ts
            ? chatMessage.ts
            : chatMessage.thread_ts
        )

        return chatMessageDeleted
      },
    },
  },
  Query: {
    chat() {
      return {}
    },
    wakaTime() {
      return {}
    },
  },
  Mutation: {
    async postChatMessage(
      obj /*: Schema.Mutation */,
      { input } /*: Schema.MutationPostChatMessageArgument */,
      { session } /*: Context */
    ) {
      const response = await slack.client.chat.postMessage({
        channel: slack.channel,
        parse: 'full',
        username: session.username,
        text: input.text,
      })

      return { chatMessage: response.message }
    },
  },
  Chat: {
    async history(
      obj /*: Schema.Chat */,
      args /*: {} */,
      { loaders } /*: Context */
    ) {
      return loaders.history.load(slack.channel)
    },
  },
  ChatMessage: {
    text(obj /*: Schema.ChatMessage */) {
      return messageParser(obj.text)
    },

    async user(
      obj /*: Schema.ChatMessage */,
      args /*: {} */,
      { loaders } /*: Context */
    ) {
      if (obj.user) {
        return loaders.user.load(obj.user)
      }

      return {
        name: obj.username,
        color: stringToColor(obj.username).slice(1),
      }
    },

    async replies(
      obj /*: Schema.ChatMessage */,
      args /*: {} */,
      { loaders } /*: Context */
    ) {
      if (obj.thread_ts === obj.ts) {
        return loaders.replies.load(obj.ts)
      }
    },

    edited(obj /*: Schema.ChatMessage */) {
      return !!obj.edited
    },
  },
  ChatMessageReply: {
    text(obj /*: Schema.ChatMessageReply */) {
      return messageParser(obj.text)
    },

    async user(
      obj /*: Schema.ChatMessageReply */,
      args /*: {} */,
      { loaders } /*: Context */
    ) {
      if (obj.user) {
        return loaders.user.load(obj.user)
      }

      return {
        name: obj.username,
        color: stringToColor(obj.username).slice(1),
      }
    },

    edited(obj /*: Schema.ChatMessage */) {
      return !!obj.edited
    },
  },
  ChatMessageOrReply: {
    __resolveType(obj /*: Schema.ChatMessage | Schema.ChatMessageReply */) {
      if (obj.thread_ts == null || obj.thread_ts === obj.ts) {
        return 'ChatMessage'
      }

      if (obj.thread_ts !== obj.ts) {
        return 'ChatMessageReply'
      }

      return null
    },
  },
  WakaTime: {
    stats(
      obj /*: Schema.WakaTime */,
      args /*: {} */,
      { loaders } /*: Context */
    ) {
      return loaders.wakaTime.load(JSON_STATS)
    },

    activity(
      obj /*: Schema.WakaTime */,
      args /*: {} */,
      { loaders } /*: Context */
    ) {
      return loaders.wakaTime.load(JSON_ACTIVITY)
    },
  },
}
