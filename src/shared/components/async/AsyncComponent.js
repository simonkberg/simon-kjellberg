import React, { Component, PropTypes } from 'react'

const { func } = PropTypes

export default class AsyncComponent extends Component {
  static propTypes = {
    loader: func.isRequired,
    placeholder: func,
  }

  static defaultProps = {
    placeholder: () => null,
  }

  state = {
    component: null,
  }

  componentDidMount () {
    this.props.loader(component => this.setState({ component }))
  }

  render () {
    // eslint-disable-next-line no-unused-vars
    const { loader, placeholder, ...props } = this.props
    const { component: Component } = this.state

    return Component ? <Component {...props} /> : this.props.placeholder(props)
  }
}
