import React, { PropTypes } from 'react'
import withStyles from 'helpers/withStyles'

import LandingIntro from './LandingIntro'
import LandingStats from './LandingStats'
import LandingLinks from './LandingLinks'
import styles from './styles.css'

export const Landing = ({ styles }) => (
  <div className={styles.landing}>
    <LandingIntro />
    <LandingStats />
    <LandingLinks />
  </div>
)

Landing.propTypes = {
  styles: PropTypes.object
}

export default withStyles(styles)(Landing)
