import { createStore, applyMiddleware } from 'redux'
import thunkMiddleware from 'redux-thunk'
import createLogger from 'redux-logger'
import rootReducer from 'reducers'

function getMiddleware () {
  const middleware = [
    thunkMiddleware
  ]

  if (__DEV__) {
    middleware.push(createLogger())
  }

  return applyMiddleware(...middleware)
}

export default function configureStore (initialState = {}) {
  const store = createStore(
    rootReducer,
    initialState,
    getMiddleware()
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
