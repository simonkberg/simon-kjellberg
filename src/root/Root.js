import React, { Component, PropTypes } from 'react'
import { Provider } from 'react-redux'
import DevTools from './DevTools'

const { object, node } = PropTypes

class Root extends Component {
  static propTypes = {
    store: object.isRequired,
    children: node.isRequired
  }

  state = {
    devTools: false
  }

  componentDidMount () {
    if (__DEV__) {
      // Enable dev tools for client after mount
      this.setState({ devTools: true })
    }
  }

  render () {
    const { store, children } = this.props
    const { devTools } = this.state

    return (
      <Provider store={store}>
        <div>
          {children}
          {devTools ? <DevTools /> : null}
        </div>
      </Provider>
    )
  }
}

export default Root
