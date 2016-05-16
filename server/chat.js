
import { Server } from 'ws'
import randomName from './lib/randomName'
import slack, { RTM_EVENTS, RTM_MESSAGE_SUBTYPES } from './lib/slack'

const { SLACK_API_TOKEN, SLACK_CHAT_CHANNEL } = process.env

module.exports = async (server) => {
  const wss = new Server({ server: server })

  const { rtm, web } = await slack(SLACK_API_TOKEN)
  const chat = rtm.dataStore.getDMById(SLACK_CHAT_CHANNEL)

  wss.on('connection', async (ws) => {
    console.log('client connected')

    const username = randomName()

    ws.on('message', (message) => {
      console.log('Client Message', message)

      web.chat.postMessage(chat.id, message, {
        parse: 'full',
        username: username
      })
    })
  })

  rtm.on(RTM_EVENTS.MESSAGE, (message) => {
    console.log('Server Message', message)

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

  return wss
}

function sendMessage (client, { subtype, username, user, text, ts, ...other }) {
  const payload = { subtype, username, user, text, ts }

  payload.edited = !!other.edited

  if (subtype === RTM_MESSAGE_SUBTYPES.MESSAGE_DELETED) {
    payload.ts = other.deleted_ts
  }

  if (subtype === RTM_MESSAGE_SUBTYPES.MESSAGE_CHANGED) {
    const { message } = other

    payload.user = message.user
    payload.text = message.text
    payload.ts = message.ts
    payload.edited = true
  }

  client.send(JSON.stringify(payload), (err) => {
    if (err) console.error(`WebSocket Error: ${err.message}`)
  })
}
