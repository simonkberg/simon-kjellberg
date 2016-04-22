import request from 'request'

const slackHook = (body = {}) => {
  return new Promise((resolve, reject) => {
    request.post({
      url: process.env.SLACK_WEBHOOK,
      json: true,
      body: body
    }, (err, res, body) => {
      if (err) return reject(err)

      resolve(body)
    })
  })
}

export default slackHook
