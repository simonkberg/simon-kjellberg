const { RTMClient, WebClient } = require('@slack/client')

function rtm(token, opts = {}) {
  const client = new RTMClient(
    token,
    Object.assign(
      {
        logLevel: 'info',
        autoReconnect: true,
        autoMark: true,
      },
      opts
    )
  )

  return new Promise((resolve, reject) => {
    client.start()

    client.on('authenticated', () => resolve(client))
  })
}

function web(token, opts = {}) {
  return new WebClient(token, opts)
}

module.exports = exports = function slack(token, opts = {}) {
  return {
    rtm: rtm(token, opts.rtm),
    web: web(token, opts.web),
  }
}

exports.rtm = rtm
exports.web = web
