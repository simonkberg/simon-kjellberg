import Helmet from 'react-helmet'
import Iso from 'iso'
import { renderToString } from 'react-dom/server'
import alt from '../alt-flux'

export default (router, locals) => {
  const { webpack_asset, css, data } = locals

  // Bootstrap data before we render
  alt.bootstrap(JSON.stringify(data || {}))

  const content = renderToString(router)
  const head = Helmet.rewind()
  const iso = new Iso()

  iso.add(content, alt.flush())

  return `
    <!doctype html>
    <html ${head.htmlAttributes.toString()}>
      <head>
        ${head.title.toString()}
        ${head.base.toString()}
        ${head.meta.toString()}
        ${head.link.toString()}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Fira+Mono:400,700">
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
