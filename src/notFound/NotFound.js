import React, { PropTypes } from 'react'
import Helmet from 'react-helmet'

import withStyles from 'helpers/withStyles'
import styles from './styles.css'

const head = { title: '404' }
const shrug = '¯\_(ツ)_/¯' // eslint-disable-line no-useless-escape

export const NotFound = ({ styles }) => (
  <div className={styles.notFound}>
    <Helmet {...head} />
    <h1>404 <small>{shrug}</small></h1>
    <p>Not Found</p>
  </div>
)

NotFound.propTypes = {
  styles: PropTypes.object
}

export default withStyles(styles)(NotFound)
