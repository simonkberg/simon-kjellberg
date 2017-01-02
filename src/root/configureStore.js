import { createStore, applyMiddleware, compose } from 'redux'
import { batchedSubscribe } from 'redux-batched-subscribe'
import { unstable_batchedUpdates as batchedUpdates } from 'react-dom'
import thunkMiddleware from 'redux-thunk'
import Immutable from 'immutable'
import rootReducer from './reducers'

function getMiddleware () {
  const middleware = [
    thunkMiddleware,
  ]

  return applyMiddleware(...middleware)
}

function getEnhancer () {
  const args = [
    getMiddleware(),
    batchedSubscribe(batchedUpdates),
  ]

  if (__DEV__) {
    const DevTools = require('./DevTools').default

    args.push(DevTools.instrument())
  }

  return compose(...args)
}

export default function configureStore (initialState = Immutable.Map()) {
  const store = createStore(
    rootReducer,
    initialState,
    getEnhancer()
  )

  if (__DEV__ && module.hot) {
    // Enable Webpack hot module replacement for reducers
    module.hot.accept('./reducers', () => {
      store.replaceReducer(rootReducer)
    })
  }

  return store
}
