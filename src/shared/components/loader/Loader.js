import React, { PropTypes } from 'react'

import withStyles from 'helpers/withStyles'
import Styles from './Loader.css'

export const Loader = ({ styles }) => (
  <div className={styles.loader}>
    <span className={styles.point1} />
    <span className={styles.point2} />
    <span className={styles.point3} />
  </div>
)

Loader.propTypes = {
  styles: PropTypes.object,
}

export default withStyles(Styles)(Loader)
