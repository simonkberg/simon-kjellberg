import request from 'request'
import express from 'express'

import parseTime from '../lib/parseTime'
import timeDiff from '../lib/timeDiff'
import timeDiffFormat from '../lib/timeDiffFormat'
import clockEmoji from '../lib/clockEmoji'

const router = express.Router()

const slack = request.defaults({
  url: process.env.SLACK_WEBHOOK,
  json: true
})

router.post('/slap', (req, res) => {
  let { user_name: user, text, channel_id } = req.body

  let target = text || user

  if (target.charAt(0) !== '@') {
    target = '@' + target
  }

  slack.post({
    body: {
      text: `<@${user}> slaps <${target}> around a bit with a large trout`,
      channel: channel_id
    }
  }, (err) => res.end(err))
})

router.post('/eta', (req, res) => {
  let { user_name: user, text } = req.body

  text = (text || '').split(' ')

  let time = parseTime(text.shift(), 'G:i')

  if (!time) {
    return res.end('You didn\'t say when...')
  }

  let reason = text.join(' ')
  let diff = timeDiffFormat(timeDiff(time))

  request.post({
    body: {
      text: `<@${user}>'s ETA is *${time}* (in ${diff})` +
        (reason ? `\n>>> _${reason}_` : ''),
      username: 'etabot',
      icon_emoji: clockEmoji(time)
    }
  }, (err) => res.end(err))
})

export default router
