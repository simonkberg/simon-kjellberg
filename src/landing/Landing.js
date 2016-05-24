import React, { Component } from 'react'
import withStyles from 'helpers/withStyles'

import { Intro, Stats, Links } from './index'
import styles from './styles.css'

class Landing extends Component {
  render () {
    return (
      <div className={styles.landing}>
        <Intro />
        <Stats />
        <Links />
      </div>
    )
  }
}

export default withStyles(styles)(Landing)
