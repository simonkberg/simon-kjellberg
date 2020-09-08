'use strict'

const { WebClient, RTMClient } = require('@slack/client')

const { SLACK_TOKEN, SLACK_CHANNEL } = process.env
const client = new WebClient(SLACK_TOKEN)
const rtm = new RTMClient(SLACK_TOKEN)

module.exports = {
  token: SLACK_TOKEN,
  channel: SLACK_CHANNEL,
  client,
  rtm,
}
