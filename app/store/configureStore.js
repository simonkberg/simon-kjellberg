import { createStore, applyMiddleware, compose } from 'redux'
import thunkMiddleware from 'redux-thunk'
import createLogger from 'redux-logger'
import rootReducer from 'reducers'
import DevTools from 'containers/DevTools'

function getMiddleware () {
  const middleware = [
    thunkMiddleware
  ]

  if (__DEV__) {
    middleware.push(createLogger())
  }

  return applyMiddleware(...middleware)
}

function getEnhancer () {
  const middleware = getMiddleware()

  if (__DEV__) {
    return compose(middleware, DevTools.instrument())
  }

  return middleware
}

export default function configureStore (initialState = {}) {
  const store = createStore(
    rootReducer,
    initialState,
    getEnhancer()
  )

  if (__DEV__ && module.hot) {
    // Enable Webpack hot module replacement for reducers
    module.hot.accept('reducers', () => {
      const nextRootReducer = require('reducers').default
      store.replaceReducer(nextRootReducer)
    })
  }

  return store
}
