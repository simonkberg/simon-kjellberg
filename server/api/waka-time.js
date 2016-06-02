const express = require('express')
const request = require('request')

const JSON_STATS = 'https://wakatime.com/@simonkberg/4a1baa98-ab8f-436e-ada0-8810ef941f76.json'
const JSON_ACTIVITY = 'https://wakatime.com/@simonkberg/bb9d21e6-a93d-4f64-b741-8a3f0b032fce.json'

const router = express.Router()

router.get('/stats', (req, res) => wakaTimeProxy(JSON_STATS, res))
router.get('/activity', (req, res) => wakaTimeProxy(JSON_ACTIVITY, res))

function wakaTimeProxy (url, res) {
  request({ url, json: true }, (err, response, body) => {
    if (err) throw err

    res.json(body)
  })
}

module.exports = router
