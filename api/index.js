import express from 'express'
import slack from './slack'
import wakaTime from './waka-time'

const router = express.Router()

router.get('/ping', (req, res, next) => {
  res.send('pong')
})

router.use('/slack', slack)
router.use('/waka-time', wakaTime)

export default router
