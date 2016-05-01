
import express from 'express'
import { web } from '../lib/slack'

const { SLACK_API_TOKEN, SLACK_CHAT_CHANNEL } = process.env

const router = express.Router()
const api = web(SLACK_API_TOKEN)

router.get('/history', (req, res) => {
  api.im.history(SLACK_CHAT_CHANNEL).then(
    response => res.json(response),
    error => res.json(error)
  )
})

export default router
