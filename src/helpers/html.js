import Helmet from 'react-helmet'
import { server } from 'helpers/isoState'

export default (content, { css, store, webpack_asset, newrelic }) => {
  const head = Helmet.rewind()
  const render = server(content, store.getState())

  const scripts = [
    webpack_asset('manifest')['js'],
    webpack_asset('vendor')['js'],
    webpack_asset('client')['js'],
  ]

  const mapToPreload = href =>
    `<link rel="preload" href="${href}" as="script">`

  const mapToScript = src =>
    `<script src="${src}" defer></script>`

  return `
    <!doctype html>
    <html lang="en" itemscope itemtype="http://schema.org/WebPage">
      <head>
        ${newrelic ? newrelic.getBrowserTimingHeader() : ''}
        ${head.title.toString()}
        ${head.base.toString()}
        ${head.meta.toString()}
        ${head.link.toString()}
        ${scripts.map(mapToPreload).join('')}
        <style>${css.join('')}</style>
      </head>
      <body>
        ${render()}
        ${head.script.toString()}
        ${scripts.map(mapToScript).join('')}
      </body>
    </html>
  `
}
