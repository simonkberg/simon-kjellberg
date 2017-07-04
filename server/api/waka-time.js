const express = require('express')
const request = require('request')
const ms = require('ms')
const Cache = require('async-cache')

const JSON_STATS =
  'https://wakatime.com/@simonkberg/4a1baa98-ab8f-436e-ada0-8810ef941f76.json'
const JSON_ACTIVITY =
  'https://wakatime.com/@simonkberg/bb9d21e6-a93d-4f64-b741-8a3f0b032fce.json'

const router = express.Router()
const maxAge = ms('6 hours')
const stats = new Cache({
  max: 2,
  load: (url, cb) =>
    request({ url, json: true }, (err, res, body) => {
      cb(err, body)
    }),
  maxAge,
})

const wakaTimeProxy = url => (req, res, next) =>
  stats.get(url, (err, data) => {
    if (err) return next(err)

    res.append('Cache-Control', `max-age=${maxAge}`)
    res.json(data)
  })

router.get('/stats', wakaTimeProxy(JSON_STATS))
router.get('/activity', wakaTimeProxy(JSON_ACTIVITY))

module.exports = router
