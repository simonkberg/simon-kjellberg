import React, { Component, PropTypes } from 'react'
import { Provider } from 'react-redux'

const { shape, func, object, node } = PropTypes

class Root extends Component {
  static propTypes = {
    context: shape({
      insertCss: func.isRequired
    }),
    store: object.isRequired,
    children: node.isRequired
  }

  static childContextTypes = {
    insertCss: func.isRequired
  }

  state = {
    DevTools: null
  }

  getChildContext () {
    const { context } = this.props

    return {
      insertCss: context.insertCss
    }
  }

  componentDidMount () {
    if (__DEV__) {
      // Enable dev tools for client after mount
      this.setState({ DevTools: require('./DevTools').default })
    }
  }

  render () {
    const { store, children } = this.props
    const { DevTools } = this.state

    return (
      <Provider store={store}>
        <div>
          {children}
          {DevTools ? <DevTools /> : null}
        </div>
      </Provider>
    )
  }
}

export default Root
