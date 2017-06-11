const debug = require('debug')
const pick = require('lodash/pick')
const Server = require('ws').Server
const randomName = require('./lib/randomName')
const slack = require('./lib/slack')
const log = debug('sk:chat')

const { RTM_EVENTS, RTM_MESSAGE_SUBTYPES } = slack
const { SLACK_API_TOKEN, SLACK_CHAT_CHANNEL } = process.env

module.exports = function chatServer(server) {
  const wss = new Server({ server: server })

  const { rtm, web } = slack(SLACK_API_TOKEN)

  wss.on('connection', ws => {
    const username = randomName()

    log(`${username} connected`)

    ws.on('message', message => {
      log(`${username}: ${message}`)

      web.chat.postMessage(SLACK_CHAT_CHANNEL, message, {
        parse: 'full',
        username: username,
      })
    })
  })

  rtm
    .then(rtmClient => {
      const chat = rtmClient.dataStore.getDMById(SLACK_CHAT_CHANNEL)

      rtmClient.on(RTM_EVENTS.MESSAGE, message => {
        if (message.channel === chat.id) {
          log(RTM_EVENTS.MESSAGE, message)

          if (message.text === '!clear') {
            web.im
              .history(chat.id)
              .then(({ messages }) =>
                messages.map(msg =>
                  web.chat.delete(msg.ts, chat.id).catch(() => null)
                )
              )
              .catch(() => null)
          }

          wss.clients.forEach(client => sendMessage(client, message))
        }
      })
    })
    .catch(err => console.error(err))

  return wss
}

function sendMessage(client, params) {
  const payload = pick(params, [
    'subtype',
    'username',
    'user',
    'text',
    'ts',
    'thread_ts',
    'reply_count',
    'replies',
  ])

  payload.edited = !!params.edited

  if (payload.subtype === RTM_MESSAGE_SUBTYPES.MESSAGE_DELETED) {
    payload.ts = params.deleted_ts
  }

  if (payload.subtype === RTM_MESSAGE_SUBTYPES.MESSAGE_CHANGED) {
    const message = Object.assign({}, params.previous_message, params.message)

    Object.assign(
      payload,
      pick(message, [
        'user',
        'text',
        'ts',
        'thread_ts',
        'reply_count',
        'replies',
      ])
    )

    payload.edited = !!message.edited
  }

  if (payload.subtype === 'message_replied') {
    Object.assign(
      payload,
      pick(params.message, ['user', 'text', 'ts', 'reply_count', 'replies'])
    )
  }

  client.send(JSON.stringify(payload), err => {
    if (err) console.error(`WebSocket Error: ${err.message}`)
  })
}
