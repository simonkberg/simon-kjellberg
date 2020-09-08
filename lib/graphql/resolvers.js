'use strict'

const stringToColor = require('../stringToColor')
const messageParser = require('../slack/messageParser')
const slack = require('../slack')
const { pubSub, ...pubSubTypes } = require('./pubSub')

const JSON_STATS =
  'https://wakatime.com/share/@simonkberg/4a1baa98-ab8f-436e-ada0-8810ef941f76.json'
const JSON_ACTIVITY =
  'https://wakatime.com/share/@simonkberg/d953295d-a434-41ae-b190-3728a02cb567.json'

module.exports = {
  Subscription: {
    chatMessageAdded: {
      subscribe: () => pubSub.asyncIterator([pubSubTypes.CHAT_MESSAGE_ADDED]),
      resolve({ chatMessageAdded }, args, { loaders }) {
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
      resolve({ chatMessageEdited }, args, { loaders }) {
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
      resolve({ chatMessageDeleted }, args, { loaders }) {
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
    async postChatMessage(obj, { input }, { session }) {
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
    async history(obj, args, { loaders }) {
      return loaders.history.load(slack.channel)
    },
  },
  ChatMessage: {
    text(obj) {
      return messageParser(obj.text)
    },

    async user(obj, args, { loaders }) {
      if (obj.user) {
        return loaders.user.load(obj.user)
      }

      return {
        name: obj.username,
        color: stringToColor(obj.username).slice(1),
      }
    },

    async replies(obj, args, { loaders }) {
      if (obj.thread_ts === obj.ts) {
        return loaders.replies.load(obj.ts)
      }
    },

    edited(obj) {
      return !!obj.edited
    },
  },
  ChatMessageReply: {
    text(obj) {
      return messageParser(obj.text)
    },

    async user(obj, args, { loaders }) {
      if (obj.user) {
        return loaders.user.load(obj.user)
      }

      return {
        name: obj.username,
        color: stringToColor(obj.username).slice(1),
      }
    },

    edited(obj) {
      return !!obj.edited
    },
  },
  ChatMessageOrReply: {
    __resolveType(obj) {
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
    stats(obj, args, { loaders }) {
      return loaders.wakaTime.load(JSON_STATS)
    },

    activity(obj, args, { loaders }) {
      return loaders.wakaTime.load(JSON_ACTIVITY)
    },
  },
}
