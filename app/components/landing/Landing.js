import React, { Component } from 'react'
import styles from './Landing.css'

import Stats from '../stats'

class Landing extends Component {
  render () {
    const githubUrl = 'https://github.com/simonkberg'
    const emailUrl = 'mailto:simon.kjellberg@gmail.com'

    return (
      <div className={styles.landing}>
        <h1>Simon Kjellberg<small>, Full Stack Developer</small></h1>
        <p>
          I'm a full stack developer with experience ranging from building
          modern, dynamic frontends, to creating backends and API services, as
          well as full server configurations and deployment procedures.
        </p>
        <Stats />
        <h2>links</h2>
        <p>
          [github](<a href={githubUrl}>{githubUrl}</a>)<br/>
          [email](<a href={emailUrl}>{emailUrl}</a>)
        </p>
        </div>
    )
  }
}

export default Landing
