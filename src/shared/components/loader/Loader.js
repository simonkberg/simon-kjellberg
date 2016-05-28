import React, { PropTypes } from 'react'

import withStyles from 'helpers/withStyles'
import styles from './styles.css'

export const Loader = ({ text, styles }) => (
  <div className={styles.loader}>
    <span className={styles.loaderText}>{text}</span>
  </div>
)

Loader.propTypes = {
  text: PropTypes.string,
  styles: PropTypes.object
}

Loader.defaultProps = {
  text: 'Loading...'
}

export default withStyles(styles)(Loader)
