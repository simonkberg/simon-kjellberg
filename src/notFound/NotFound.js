import React from 'react'
import Helmet from 'react-helmet'

import withStyles from 'helpers/withStyles'
import styles from './styles.css'

const head = { title: '404' }
const shrug = '¯\_(ツ)_/¯' // eslint-disable-line no-useless-escape

const NotFound = (
  <div className={styles.notFound}>
    <Helmet {...head} />
    <h1>404 <small>{shrug}</small></h1>
    <p>Not Found</p>
  </div>
)

export default withStyles(styles)(NotFound)
