import React, { Component, PropTypes } from 'react'
import { routerShape, locationShape } from 'react-router/es/PropTypes'
import { connect } from 'react-redux'
import getDisplayName from './getDisplayName'

const { string } = PropTypes

export default function withUrl (ComposedComponent) {
  class WithUrl extends Component {
    static displayName = `WithUrl(${getDisplayName(ComposedComponent)})`;
    static ComposedComponent = ComposedComponent;

    static contextTypes = {
      router: routerShape,
    }

    static propTypes = {
      location: locationShape,
      baseUrl: string,
    }

    componentWillMount () {
      const { props, context } = this

      this._setUrl(props, context)
    }

    componentWillReceiveProps (props, context) {
      this._setUrl(props, context)
    }

    _setUrl = (props, context) => {
      const { router } = context
      const { baseUrl, location } = props

      this.setState({
        url: baseUrl + router.createHref(location),
      })
    }

    render () {
      return <ComposedComponent {...this.state} {...this.props} />
    }
  }

  const mapStateToProps = state => ({ baseUrl: state.getIn(['app', 'baseUrl']) })

  return connect(mapStateToProps)(WithUrl)
}
