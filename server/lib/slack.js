const {
  RtmClient,
  WebClient,
  MemoryDataStore,
  CLIENT_EVENTS,
  RTM_EVENTS,
  RTM_MESSAGE_SUBTYPES,
} = require('@slack/client')

function rtm (token, opts = {}) {
  const client = new RtmClient(
    token,
    Object.assign(
      {
        logLevel: 'info',
        dataStore: new MemoryDataStore({}),
        autoReconnect: true,
        autoMark: true,
      },
      opts
    )
  )

  return new Promise((resolve, reject) => {
    client.start()

    client.on(CLIENT_EVENTS.RTM.AUTHENTICATED, _ => resolve(client))
  })
}

function web (token, opts = {}) {
  return new WebClient(token, opts)
}

module.exports = exports = function slack (token, opts = {}) {
  return {
    rtm: rtm(token, opts.rtm),
    web: web(token, opts.web),
  }
}

exports.rtm = rtm
exports.web = web

exports.CLIENT_EVENTS = CLIENT_EVENTS
exports.CLIENT_EVENTS = CLIENT_EVENTS
exports.RTM_EVENTS = RTM_EVENTS
exports.RTM_MESSAGE_SUBTYPES = RTM_MESSAGE_SUBTYPES
