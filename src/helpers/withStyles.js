import React, { Component, PropTypes } from 'react'
import getDisplayName from './getDisplayName'

const { func } = PropTypes

export default function withStyles (styles) {
  return ComposedComponent => class WithStyles extends Component {
    static contextTypes = {
      insertCss: func.isRequired,
    };

    static displayName = `WithStyles(${getDisplayName(ComposedComponent)})`;
    static ComposedComponent = ComposedComponent;

    componentWillMount () {
      const { insertCss } = this.context

      this._removeCss = insertCss(styles, { replace: true })
    }

    componentWillUnmount () {
      setTimeout(this._removeCss, 0)
    }

    render () {
      return <ComposedComponent {...this.props} styles={styles} />
    }
  }
}
