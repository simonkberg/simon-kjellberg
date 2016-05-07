
import { Server } from 'ws'
import { rtm, RTM_EVENTS, RTM_MESSAGE_SUBTYPES } from './lib/slack'

const { SLACK_API_TOKEN, SLACK_CHAT_CHANNEL } = process.env

module.exports = async (server) => {
  const wss = new Server({ server: server })

  const api = await rtm(SLACK_API_TOKEN)
  const chat = api.dataStore.getDMById(SLACK_CHAT_CHANNEL)

  wss.on('connection', async (ws) => {
    console.log('client connected')

    ws.on('message', (message) => {
      console.log('Client Message', message)

      api.sendMessage(message, chat.id)
        .then(res => sendMessage(ws, res))
    })
  })

  api.on(RTM_EVENTS.MESSAGE, (message) => {
    console.log('Server Message', message)

    if (message.channel === chat.id) {
      wss.clients.forEach(client => sendMessage(client, message))
    }
  })

  function sendMessage (client, { subtype, user, text, ts, ...other }) {
    const payload = { subtype, user, text, ts }

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

  return wss
}
