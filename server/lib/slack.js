import {
  RtmClient,
  WebClient,
  MemoryDataStore,
  CLIENT_EVENTS,
  RTM_EVENTS,
  RTM_MESSAGE_SUBTYPES
} from '@slack/client'

export default async function slack (token, opts = {}) {
  const rtm = await rtm(token, opts)
  const api = api(token, opts)

  return {
    rtm: rtm,
    web: web
  }
}

export function rtm (token, opts) {
  const rtm = new RtmClient(token, Object.assign({
    logLevel: 'info',
    dataStore: new MemoryDataStore({}),
    autoReconnect: true,
    autoMark: true
  }, opts))

  return new Promise((resolve, reject) => {
    rtm.start()

    rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, () => resolve(rtm))
  })
}

export function web (token, opts = {}) {
  return new WebClient(token, opts)
}

export {
  CLIENT_EVENTS,
  RTM_EVENTS,
  RTM_MESSAGE_SUBTYPES
}
