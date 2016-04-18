import React, { Component } from 'react'

class LandingLinks extends Component {
  render () {
    const githubUrl = 'https://github.com/simonkberg'
    const emailUrl = 'mailto:simon.kjellberg@gmail.com'

    return (
      <div>
        <h2>links</h2>
        <p>
          [github](<a href={githubUrl} target='_blank'>{githubUrl}</a>)<br/>
          [email](<a href={emailUrl} target='_blank'>{emailUrl}</a>)
        </p>
      </div>
    )
  }
}

export default LandingLinks
