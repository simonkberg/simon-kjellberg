import Helmet from 'react-helmet'
import { server } from 'helpers/isoState'

export default (content, { css, store, webpack_asset, newrelic }) => {
  const head = Helmet.rewind()
  const render = server(content, store.getState())

  return `
    <!doctype html>
    <html lang="en" itemscope itemtype="http://schema.org/WebPage">
      <head>
        ${newrelic ? newrelic.getBrowserTimingHeader() : ''}
        ${head.title.toString()}
        ${head.base.toString()}
        ${head.meta.toString()}
        ${head.link.toString()}
        <style>${css.join('')}</style>
      </head>
      <body>
        ${render()}
        ${head.script.toString()}
        <script src="${webpack_asset('vendor')['js']}"></script>
        <script async src="${webpack_asset('client')['js']}"></script>
      </body>
    </html>
  `
}
