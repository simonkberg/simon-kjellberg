import React from 'react'
import { Route, IndexRoute } from 'react-router'

import App from 'components/app'
import Landing from 'components/landing'
import NotFound from 'components/notFound'

export default (
  <Route path='/' component={App}>
    <IndexRoute component={Landing} />
    <Route path='*' status={404} component={NotFound} />
  </Route>
)
