
const express = require('express')
const { web } = require('../lib/slack')

const { SLACK_API_TOKEN, SLACK_CHAT_CHANNEL } = process.env

const router = express.Router()
const api = web(SLACK_API_TOKEN)

router.get('/history', (req, res) => {
  api.im.history(SLACK_CHAT_CHANNEL).then(
    response => {
      response.messages = response.messages.map(mapMessages)

      return res.json(response)
    },
    error => res.json(error),
  )
})

router.get('/users/:id', (req, res) => {
  api.users.info(req.params.id).then(
    response => {
      response.users = [response.user].map(mapUsers)

      delete response.user

      return res.json(response)
    },
    error => res.json(error),
  )
})

router.get('/users', (req, res) => {
  api.users.list().then(
    response => {
      response.users = response.members.map(mapUsers)

      delete response.members
      delete response.cache_ts

      return res.json(response)
    },
    error => res.json(error),
  )
})

function mapMessages ({ subtype, username, user, text, ts, edited }) {
  return { subtype, username, user, text, ts, edited: !!edited }
}

function mapUsers ({ id, name, color }) {
  return { id, name, color }
}

module.exports = router
