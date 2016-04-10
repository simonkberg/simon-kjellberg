
import React from 'react'
import { match, RouterContext } from 'react-router'
import htmlHelper from './helpers/html'
import routes from './routes'

export default () => {
  return (req, res, next) => {
    const { locals } = res

    locals.css = []

    const context = {
      insertCss: (styles) => locals.css.push(styles._getCss())
    }

    match({ routes, location: req.url }, (error, redirect, props) => {
      if (error) {
        return res.status(500).send(error.message)
      }

      if (redirect) {
        return res.redirect(302, redirect.pathname + redirect.search)
      }

      if (props) {
        const { status } = props.routes.find((route) => route.status) || {
          status: 200
        }

        const createElement = (Component, props) => {
          return <Component context={context} {...props} />
        }

        const html = htmlHelper(<RouterContext createElement={createElement} {...props} />, locals)

        return res.status(status).send(html)
      }

      res.status(500).send('How the fuck?')
    })
  }
}
