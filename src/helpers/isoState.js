import serialize from 'serialize-javascript'

const NODE_KEY = 'data-iso-state'
const JSON_KEY = '__ISO_STATE'

function server(content, state) {
  return function render() {
    return (
      `<div ${NODE_KEY}>${content}</div>` +
      `<script>window.${JSON_KEY}=${serialize(state)}</script>`
    )
  }
}

function client(cb) {
  const node = document.querySelectorAll(`[${NODE_KEY}]`)[0]
  const state = window[JSON_KEY]

  cb(state, node)
}

export { server, client }
