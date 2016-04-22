
import React, { Component, PropTypes } from 'react'
import classNames from 'classnames'
import withStyles from 'helpers/withStyles'
import styles from './Column.scss'

const { oneOfType, array, string, object, node, number } = PropTypes

class Column extends Component {
  static propTypes = {
    className: oneOfType([array, string, object]),
    children: node,
    col: oneOfType([array, string])
  }

  static defaultProps = {
    col: 'md-1'
  }

  state = {
    layout: null
  }

  componentWillMount () {
    const { col } = this.props

    this._setLayout(col)
  }

  componentWillReceiveProps (props) {
    const { col: oldCol } = this.props
    const { col: nextCol } = props

    if (nextCol !== oldCol) {
      this._setLayout(nextCol)
    }
  }

  _setLayout = (col) => {
    if (typeof col === 'string') {
      if (col.includes(',')) {
        col = col.split(',')
      } else {
        col = col.split(' ')
      }
    }

    this.setState({
      layout: col.map((val) => `layout-col-${val.trim()}`)
    })
  }

  render () {
    const { className } = this.props
    const { layout } = this.state
    const layoutClassName = classNames(layout, className)

    return (
      <div className={layoutClassName}>
        {this.props.children}
      </div>
    )
  }
}

export default withStyles(Column, styles)
