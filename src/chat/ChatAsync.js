import React from 'react'
import AsyncComponent from 'shared/components/async'

const loader = cb => import('./Chat').then(Chat => cb(Chat.default))

export default (props) => <AsyncComponent {...props} loader={loader} />
