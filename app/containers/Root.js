import React, { Component, PropTypes } from 'react'
import { Provider } from 'react-redux'

const { object, node } = PropTypes

class Root extends Component {
  static propTypes = {
    store: object.isRequired,
    children: node.isRequired
  }

  render () {
    const { store, children } = this.props

    return <Provider store={store} children={children} />
  }
}

export default Root
