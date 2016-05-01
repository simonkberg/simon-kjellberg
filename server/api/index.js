import express from 'express'
import chat from './chat'
import slack from './slack'
import wakaTime from './waka-time'

const router = express.Router()

router.get('/ping', (req, res, next) => {
  res.send('pong')
})

router.use('/chat', chat)
router.use('/slack', slack)
router.use('/waka-time', wakaTime)

export default router
