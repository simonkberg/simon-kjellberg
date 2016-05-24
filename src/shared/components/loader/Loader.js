import React, { Component, PropTypes } from 'react'

import withStyles from 'helpers/withStyles'
import styles from './Loader.css'

const { string } = PropTypes

class Loader extends Component {
  static propTypes = {
    text: string
  }

  static defaultProps = {
    text: 'Loading...'
  }

  render () {
    const { text } = this.props

    return (
      <div className={styles.loader}>
        <span className={styles.loaderText}>{text}</span>
      </div>
    )
  }
}

export default withStyles(styles)(Loader)
