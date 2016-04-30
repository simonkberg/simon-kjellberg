
import 'babel-polyfill'
import 'isomorphic-fetch'
import React from 'react'
import { render } from 'react-dom'
import { Router, match, browserHistory as history } from 'react-router'
import Iso from 'iso'
import ga from 'react-ga'
import routes from './routes'
import configureStore from './store/configureStore'
import Root from './containers/Root'

ga.initialize('UA-2241753-14')

match({ history, routes }, (err, redirectLocation, renderProps) => {
  if (err) throw err

  Iso.bootstrap((state, container) => {
    const context = {
      insertCss: (styles) => styles._insertCss()
    }

    renderProps.createElement = function createElement (Component, props) {
      return <Component context={context} {...props} />
    }

    renderProps.onUpdate = function trackPageView () {
      ga.pageview(window.location.pathname)
    }

    render(
      <Root store={configureStore(state)}>
        <Router {...renderProps} />
      </Root>,
      container
    )
  })
})
