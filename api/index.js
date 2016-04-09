import express from 'express'
import slack from './slack'

const router = express.Router()

router.get('/ping', (req, res, next) => {
  res.send('pong')
})

router.use('/slack', slack)

export default router
