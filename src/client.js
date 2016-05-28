
import 'babel-polyfill'
import 'isomorphic-fetch'
import React from 'react'
import { render } from 'react-dom'
import { Router, match, browserHistory as history } from 'react-router'
import Immutable from 'immutable'
import Iso from 'iso'
import ga from 'react-ga'
import Root, { configureStore, routes } from 'root'

ga.initialize('UA-2241753-14')

match({ history, routes }, (error, redirect, props) => {
  if (error) throw error

  Iso.bootstrap((state, container) => {
    const store = configureStore(Immutable.fromJS(state))
    const context = { insertCss: (styles) => styles._insertCss() }

    props.createElement = function createElement (Component, props) {
      return <Component context={context} {...props} />
    }

    props.onUpdate = function trackPageView () {
      ga.pageview(window.location.pathname)
    }

    render(
      <Root store={store}>
        <Router {...props} />
      </Root>,
      container
    )
  })
})
