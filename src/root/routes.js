import React from 'react'
import Route from 'react-router/lib/Route'
import IndexRoute from 'react-router/lib/IndexRoute'

import App from 'app'
import Landing from 'landing'
import NotFound from 'notFound'

export default (
  <Route path='/' component={App}>
    <IndexRoute component={Landing} />
    <Route path='*' status={404} component={NotFound} />
  </Route>
)
