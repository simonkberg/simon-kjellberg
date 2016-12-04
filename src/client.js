
import 'babel-polyfill'
import 'isomorphic-fetch'
import React from 'react'
import { render } from 'react-dom'
import { Router, match, browserHistory as history } from 'react-router'
import { AppContainer } from 'react-hot-loader'
import Immutable from 'immutable'
import { client } from 'helpers/isoState'
import ReactGA from 'react-ga'
import Root, { configureStore, routes } from 'root'

if (__DEV__) {
  window.Perf = require('react-addons-perf')
}

const gaId = process.env.GA_ID
if (gaId) { ReactGA.initialize(gaId) }

match({ history, routes }, (error, redirect, props) => {
  if (error) throw error

  client((state, container) => {
    const store = configureStore(Immutable.fromJS(state))
    const context = { insertCss: (styles, opts) => styles._insertCss(opts) }

    props.onUpdate = function trackPageView () {
      ReactGA.set({ page: window.location.pathname })
      ReactGA.pageview(window.location.pathname)
    }

    render(
      <AppContainer>
        <Root store={store} context={context}>
          <Router {...props} />
        </Root>
      </AppContainer>,
      container,
    )

    if (module.hot) {
      module.hot.accept('root', () => {
        render(
          <AppContainer>
            <Root store={store} context={context}>
              <Router {...props} />
            </Root>
          </AppContainer>,
          container,
        )
      })
    }
  })
})
