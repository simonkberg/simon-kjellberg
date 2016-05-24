import React from 'react'
import Helmet from 'react-helmet'
import Iso from 'iso'
import { renderToString } from 'react-dom/server'
import Root, { configureStore } from 'root'

export default (router, locals) => {
  const { webpack_asset, css, data, newrelic } = locals

  const store = configureStore(data || {})
  const content = renderToString(<Root store={store}>{router}</Root>)
  const head = Helmet.rewind()
  const iso = new Iso()

  iso.add(content, store.getState())

  return `
    <!doctype html>
    <html ${head.htmlAttributes.toString()}>
      <head>
        ${newrelic ? newrelic.getBrowserTimingHeader() : ''}
        ${head.title.toString()}
        ${head.base.toString()}
        ${head.meta.toString()}
        ${head.link.toString()}
        <style>${css.join('')}</style>
      </head>
      <body>
        ${iso.render()}
        ${head.script.toString()}
        <script async src="${webpack_asset('client')['js']}"></script>
      </body>
    </html>
  `
}
