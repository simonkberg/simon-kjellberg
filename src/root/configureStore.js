import { createStore, applyMiddleware, compose } from 'redux'
import thunkMiddleware from 'redux-thunk'
import Immutable from 'immutable'
import rootReducer from './reducers'

const devToolsCompose =
  __DEV__ &&
  typeof window !== 'undefined' &&
  window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
const composeEnhancers = devToolsCompose || compose

function getMiddleware () {
  const middleware = [thunkMiddleware]

  return applyMiddleware(...middleware)
}

function getEnhancer () {
  const args = [getMiddleware()]

  if (__DEV__ && !devToolsCompose) {
    const DevTools = require('./DevTools').default

    args.push(DevTools.instrument())
  }

  return composeEnhancers(...args)
}

export default function configureStore (initialState = Immutable.Map()) {
  const store = createStore(rootReducer, initialState, getEnhancer())

  if (__DEV__ && module.hot) {
    // Enable Webpack hot module replacement for reducers
    module.hot.accept('./reducers', () => {
      store.replaceReducer(rootReducer)
    })
  }

  return store
}
