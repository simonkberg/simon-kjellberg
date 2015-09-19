import express from 'express'
import request from 'request'

import parseTime from '../lib/parseTime'
import timeDiff from '../lib/timeDiff'
import timeDiffFormat from '../lib/timeDiffFormat'
import clockEmoji from '../lib/clockEmoji'

const router = express.Router()

router.post('/slap', (req, res) => {
  let user = req.body.user_name
  let target = req.body.text ? req.body.text : user

  if (target.charAt(0) !== '@') {
    target = '@' + target
  }

  let channel = req.body.channel_id

  request({
    method: 'post',
    url: process.env.SLAPBOT_URL,
    json: true,
    body: {
      text: '<@' + user + '> slaps <' + target + '> around a bit with a large trout',
      channel: channel
    }
  }, (error, response, body) => {
    res.end(error)
  })
})

router.post('/eta', (req, res) => {
  let user = req.body.user_name
  let text = (req.body.text || '').split(' ')
  let time = parseTime(text.shift(), 'G:i')
  let reason = text.join(' ')

  if (!time) {
    res.end("You didn't say when...")
  } else {
    let diff = timeDiff(time)

    request({
      method: 'post',
      url: process.env.SLAPBOT_URL,
      json: true,
      body: {
        text: '<@' + user + ">'s ETA is *" + time + '* ' +
          '(in ' + timeDiffFormat(diff) + ')' +
          (reason ? '\n>>> _' + reason + '_' : ''),
        username: 'etabot',
        icon_emoji: clockEmoji(time)
      }
    }, (error, response, body) => {
      res.end(error)
    })
  }
})

module.exports = router
