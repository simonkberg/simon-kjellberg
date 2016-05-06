
import { Server } from 'ws'
import { rtm, RTM_EVENTS } from './lib/slack'

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
    })

    api.on(RTM_EVENTS.MESSAGE, (message) => {
      console.log('Server Message', message)

      if (message.channel === chat.id) {
        const { type, user, text, ts } = message

        ws.send(JSON.stringify({
          type,
          user,
          text,
          ts
        }))
      }
    })
  })

  return wss
}
