
import 'babel-polyfill'
import 'isomorphic-fetch'
import React from 'react'
import { render } from 'react-dom'
import { Router, match, browserHistory as history } from 'react-router'
import Iso from 'iso'
import ga from 'react-ga'
import alt from './alt-flux'
import routes from './routes'

ga.initialize('UA-2241753-14')

match({ history, routes }, (err, redirectLocation, renderProps) => {
  if (err) throw err

  Iso.bootstrap((state, container) => {
    alt.bootstrap(state)

    const context = {
      insertCss: (styles) => styles._insertCss()
    }

    renderProps.createElement = function createElement (Component, props) {
      return <Component context={context} {...props} />
    }

    renderProps.onUpdate = function trackPageView () {
      ga.pageview(this.state.location.pathname)
    }

    render(<Router {...renderProps} />, container)
  })
})
