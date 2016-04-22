import React, { Component, PropTypes } from 'react'
import getDisplayName from './getDisplayName'

export default function withStyles (ComposedComponent, ...styles) {
  return class WithStyles extends Component {
    static contextTypes = {
      insertCss: PropTypes.func.isRequired
    }

    static displayName = `WithStyles(${getDisplayName(ComposedComponent)})`
    static ComposedComponent = ComposedComponent

    componentWillMount () {
      const { insertCss } = this.context

      this._removeCss = insertCss.apply(undefined, styles, { replace: true })
    }

    componentWillUnmount () {
      setTimeout(this._removeCss, 0)
    }

    render () {
      return <ComposedComponent {...this.props} />
    }
  }
}
