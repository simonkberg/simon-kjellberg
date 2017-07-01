const express = require('express')
const moment = require('moment')

const slackHook = require('../lib/slackHook')
const clockEmoji = require('../lib/clockEmoji')

const router = express.Router()

const { SLACK_SLAP_TOKEN, SLACK_ETA_TOKEN, SLACK_ETA_CHANNEL } = process.env

router.post('/slap', (req, res) => {
  let { user_name: user, text, channel_id, token } = req.body

  if (token !== SLACK_SLAP_TOKEN) {
    return res.end('Invalid token')
  }

  let target = text || user

  if (target.charAt(0) !== '@') {
    target = '@' + target
  }

  const payload = {
    text: `<@${user}> slaps <${target}> around a bit with a large trout`,
    channel: channel_id,
    username: 'slapbot',
    icon_emoji: ':fish:',
  }

  slackHook(payload).then(() => res.end()).catch(err => res.end(err))
})

router.post('/eta', (req, res) => {
  let { user_name: user, text, token } = req.body

  if (token !== SLACK_ETA_TOKEN) {
    return res.end('Invalid token')
  }

  text = (text || '').split(' ')

  let time = moment(text.shift(), ['HHmma'])
  let reason = text.join(' ')

  if (!time.isValid()) {
    return res.end("Couldn't parse the time. Sorry!")
  }

  const payload = {
    text:
      `<@${user}>'s ETA is *${time.format('H:mm')}* (${time.fromNow()})` +
      (reason ? `\n>>> _${reason}_` : ''),
    channel: SLACK_ETA_CHANNEL,
    username: 'etabot',
    icon_emoji: clockEmoji(time),
  }

  slackHook(payload).then(() => res.end()).catch(err => res.end(err))
})

module.exports = router
