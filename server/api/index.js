const express = require('express')
const chat = require('./chat')
const slack = require('./slack')
const wakaTime = require('./waka-time')

const router = express.Router()

router.use((req, res, next) => {
  res.append('Cache-Control', 'no-cache')
  next()
})

router.get('/ping', (req, res, next) => {
  res.send('pong')
})

router.use('/chat', chat)
router.use('/slack', slack)
router.use('/waka-time', wakaTime)

module.exports = router
