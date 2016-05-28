
import 'isomorphic-fetch'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { match, RouterContext } from 'react-router'
import Root, { routes, configureStore } from 'root'
import htmlHelper from 'helpers/html'

export default () => {
  return (req, res, next) => {
    match({ routes, location: req.url }, (error, redirect, props) => {
      if (error) {
        return res.status(500).send(error.message)
      }

      if (redirect) {
        return res.redirect(302, redirect.pathname + redirect.search)
      }

      if (props) {
        const { locals: { state, webpack_asset, newrelic } } = res

        const css = []
        const context = { insertCss: styles => css.push(styles._getCss()) }
        const store = configureStore(state)
        const content = renderToString(
          <Root store={store} context={context}>
            <RouterContext {...props} />
          </Root>
        )

        const html = htmlHelper(content, {
          css, store, webpack_asset, newrelic
        })

        const { status } = props.routes.find(route => route.status) || {}

        return res.status(status || 200).send(html)
      }

      res.status(500).send('How the fuck?')
    })
  }
}
