
const Server = require('ws').Server
const randomName = require('./lib/randomName')
const slack = require('./lib/slack')

const { RTM_EVENTS, RTM_MESSAGE_SUBTYPES } = slack
const { SLACK_API_TOKEN, SLACK_CHAT_CHANNEL } = process.env

module.exports = function chatServer (server) {
  const wss = new Server({ server: server })

  const { rtm, web } = slack(SLACK_API_TOKEN)

  wss.on('connection', ws => {
    const username = randomName()

    ws.on('message', (message) => {
      web.chat.postMessage(SLACK_CHAT_CHANNEL, message, {
        parse: 'full',
        username: username,
      })
    })
  })

  rtm.then(rtmClient => {
    const chat = rtmClient.dataStore.getDMById(SLACK_CHAT_CHANNEL)

    rtmClient.on(RTM_EVENTS.MESSAGE, message => {
      if (message.channel === chat.id) {
        if (message.text === '!clear') {
          web.im.history(chat.id).then(({ messages }) => {
            return messages.map(msg => {
              return web.chat.delete(msg.ts, chat.id)
              .catch(() => null)
            })
          }).catch(() => null)
        }

        wss.clients.forEach(client => sendMessage(client, message))
      }
    })
  }).catch(err => console.error(err))

  return wss
}

function sendMessage (client, params) {
  const { subtype, username, user, text, ts } = params
  const payload = { subtype, username, user, text, ts }

  payload.edited = !!params.edited

  if (subtype === RTM_MESSAGE_SUBTYPES.MESSAGE_DELETED) {
    payload.ts = params.deleted_ts
  }

  if (subtype === RTM_MESSAGE_SUBTYPES.MESSAGE_CHANGED) {
    const { message } = params

    payload.user = message.user
    payload.text = message.text
    payload.ts = message.ts
    payload.edited = true
  }

  client.send(JSON.stringify(payload), err => {
    if (err) console.error(`WebSocket Error: ${err.message}`)
  })
}
