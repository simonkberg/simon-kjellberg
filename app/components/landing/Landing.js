import React, { Component } from 'react'
import styles from './Landing.css'

import Stats from '../stats'

class Landing extends Component {
  render () {
    return (
      <div className={styles.landing}>
        <h1>Simon Kjellberg<small>, Full Stack Developer</small></h1>
        <p>
          I'm a full stack developer with experience ranging from building
          modern, dynamic frontends, to creating backends and API services, as
          well as full server configurations and deployment procedures.
        </p>
        <Stats />
      </div>
    )
  }
}

export default Landing
