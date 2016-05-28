import Helmet from 'react-helmet'
import Iso from 'iso'

export default (content, { css, store, webpack_asset, newrelic }) => {
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
