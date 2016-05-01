
import { Server } from 'ws'
import { rtm, RTM_EVENTS } from './lib/slack'

const { SLACK_API_TOKEN, SLACK_CHAT_CHANNEL } = process.env

module.exports = async (server) => {
  const wss = new Server({ server: server })

  const api = await rtm(SLACK_API_TOKEN)
  const chat = rtm.dataStore.getDMById(SLACK_CHAT_CHANNEL)

  wss.on('connection', async (ws) => {
    ws.on('message', (message) => {
      api.sendMessage(message, chat.id)
    })

    api.on(RTM_EVENTS.MESSAGE, (message) => {
      if (message.channel === chat.id) {
        ws.send(message)
      }
    })
  })

  return wss
}
