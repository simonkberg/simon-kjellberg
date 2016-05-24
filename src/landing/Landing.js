import React from 'react'
import withStyles from 'helpers/withStyles'

import LandingIntro from './LandingIntro'
import LandingStats from './LandingStats'
import LandingLinks from './LandingLinks'
import styles from './styles.css'

export const Landing = () => (
  <div className={styles.landing}>
    <LandingIntro />
    <LandingStats />
    <LandingLinks />
  </div>
)

export default withStyles(styles)(Landing)
