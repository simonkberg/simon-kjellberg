
import React, { Component, PropTypes } from 'react'
import classNames from 'classnames'
import withStyles from 'helpers/withStyles'
import styles from './Container.scss'

const { oneOfType, array, string, object, node, bool } = PropTypes

class Container extends Component {
  static propTypes = {
    className: oneOfType([array, string, object]),
    children: node,
    fluid: bool
  }

  static defaultProps = {
    fluid: false
  }

  render () {
    const { className, fluid } = this.props
    const layoutClassName = classNames(
      {
        'layout-container': !fluid,
        'layout-container-fluid': fluid
      },
      className
    )

    return (
      <div className={layoutClassName}>
        {this.props.children}
      </div>
    )
  }
}

export default withStyles(Container, styles)
