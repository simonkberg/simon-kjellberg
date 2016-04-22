
import React, { Component, PropTypes } from 'react'
import classNames from 'classnames'
import withStyles from 'helpers/withStyles'
import styles from './Row.scss'

const { oneOfType, array, string, object, node, bool } = PropTypes

class Row extends Component {
  static propTypes = {
    className: oneOfType([array, string, object]),
    children: node,
    pad: bool
  }

  static defaultProps = {
    pad: false
  }

  render () {
    const { className, pad } = this.props
    const layoutClassName = classNames(
      'layout-row',
      { 'layout-row-pad': pad },
      className
    )

    return (
      <div className={layoutClassName}>
        {this.props.children}
      </div>
    )
  }
}

export default withStyles(Row, styles)
