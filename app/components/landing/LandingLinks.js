import React, { Component } from 'react'

class LandingLinks extends Component {
  render () {
    const githubLink = {
      href: 'https://github.com/simonkberg',
      target: '_blank'
    }

    const emailLink = {
      href: 'mailto:simon.kjellberg@gmail.com'
    }

    return (
      <div>
        <h2>links</h2>
        <p>
          <small>[github](<a {...githubLink}>{githubLink.href}</a>)</small>
          <br/>
          <small>[email](<a {...emailLink}>{emailLink.href}</a>)</small>
        </p>
      </div>
    )
  }
}

export default LandingLinks
