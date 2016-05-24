
import 'babel-polyfill'
import 'isomorphic-fetch'
import React from 'react'
import { render } from 'react-dom'
import { Router, match, browserHistory as history } from 'react-router'
import Iso from 'iso'
import ga from 'react-ga'
import Root, { configureStore, routes } from 'root'

match({ history, routes }, (error, redirect, props) => {
  if (error) throw error

  Iso.bootstrap((state, container) => {
    const context = {
      insertCss: (styles) => styles._insertCss()
    }

    props.createElement = function createElement (Component, props) {
      return <Component context={context} {...props} />
    }

    props.onUpdate = function trackPageView () {
      ga.pageview(window.location.pathname)
    }

    render(
      <Root store={configureStore(state)}>
        <Router {...props} />
      </Root>,
      container
    )
  })
})
