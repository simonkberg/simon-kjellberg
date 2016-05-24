import React from 'react'
import { Route, IndexRoute } from 'react-router'

import App from 'app'
import Landing from 'landing'
import NotFound from 'notFound'

export default (
  <Route path='/' component={App}>
    <IndexRoute component={Landing} />
    <Route path='*' status={404} component={NotFound} />
  </Route>
)
