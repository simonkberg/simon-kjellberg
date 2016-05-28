
import 'babel-polyfill'
import 'isomorphic-fetch'
import React from 'react'
import { render } from 'react-dom'
import { Router, match, browserHistory as history } from 'react-router'
import Immutable from 'immutable'
import Iso from 'iso'
import ga from 'react-ga'
import Root, { configureStore, routes } from 'root'

const gaId = process.env.GA_ID
if (gaId) { ga.initialize(gaId) }

match({ history, routes }, (error, redirect, props) => {
  if (error) throw error

  Iso.bootstrap((state, container) => {
    const store = configureStore(Immutable.fromJS(state))
    const context = { insertCss: (styles, opts) => styles._insertCss(opts) }

    props.onUpdate = function trackPageView () {
      ga.pageview(window.location.pathname)
    }

    render(
      <Root store={store} context={context}>
        <Router {...props} />
      </Root>,
      container
    )
  })
})
