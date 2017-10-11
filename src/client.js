import 'babel-polyfill'
import 'isomorphic-fetch'

import React from 'react'
import { hydrate } from 'react-dom'
import Router from 'react-router/lib/Router'
import match from 'react-router/lib/match'
import history from 'react-router/lib/browserHistory'
import { AppContainer } from 'react-hot-loader'
import Immutable from 'immutable'
import { client } from 'helpers/isoState'
import ReactGA from 'react-ga'
import Root, { configureStore, routes } from 'root'

const gaId = process.env.GA_ID

if (!__DEV__) {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
  }
}

if (gaId) {
  ReactGA.initialize(gaId)
}

match({ history, routes }, (error, redirect, props) => {
  if (error) throw error

  client((state, container) => {
    const store = configureStore(Immutable.fromJS(state))
    const context = { insertCss: (styles, opts) => styles._insertCss(opts) }

    if (gaId) {
      props.onUpdate = function trackPageView() {
        ReactGA.set({ page: window.location.pathname })
        ReactGA.pageview(window.location.pathname)
      }
    }

    const renderApp = () =>
      hydrate(
        <AppContainer>
          <Root store={store} context={context}>
            <Router {...props} />
          </Root>
        </AppContainer>,
        container
      )

    renderApp()

    if (module.hot) {
      module.hot.accept('root', () => renderApp)
    }
  })
})
