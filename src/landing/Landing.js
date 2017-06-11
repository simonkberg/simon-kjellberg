import PropTypes from 'prop-types'
import React from 'react'
import withStyles from 'helpers/withStyles'

import LandingIntro from './LandingIntro'
import LandingStats from './LandingStats'
import LandingLinks from './LandingLinks'
import Styles from './Landing.css'

export const Landing = ({ styles }) =>
  <div className={styles.landing}>
    <LandingIntro />
    <LandingStats />
    <LandingLinks styles={styles} />
  </div>

Landing.propTypes = {
  styles: PropTypes.object,
}

export default withStyles(Styles)(Landing)
