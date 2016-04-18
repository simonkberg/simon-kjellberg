
import 'babel-polyfill'
import 'isomorphic-fetch'
import React from 'react'
import { render } from 'react-dom'
import { Router, match, browserHistory as history } from 'react-router'
import Iso from 'iso'
import alt from './alt-flux'
import routes from './routes'

match({ history, routes }, (err, redirectLocation, renderProps) => {
  if (err) throw err

  Iso.bootstrap((state, container) => {
    alt.bootstrap(state)

    const context = {
      insertCss: (styles) => styles._insertCss(),
      setStatus: () => {}
    }

    renderProps.createElement = function createElement (Component, props) {
      return <Component context={context} {...props} />
    }

    render(<Router {...renderProps} />, container)
  })
})
