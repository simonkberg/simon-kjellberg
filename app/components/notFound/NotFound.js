import React, { Component } from 'react'
import Helmet from 'react-helmet'

import withStyles from 'helpers/withStyles'
import styles from './NotFound.css'

class NotFound extends Component {
  render () {
    const head = {
      title: '404'
    }

    return (
      <div className={styles.notFound}>
        <Helmet {...head} />
        <h1>404 <small>¯\_(ツ)_/¯</small></h1>
        <p>Not Found</p>
      </div>
    )
  }
}

export default withStyles(NotFound, styles)
