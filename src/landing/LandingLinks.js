import React from 'react'

const githubLink = {
  href: 'https://github.com/simonkberg',
  target: '_blank',
}

const emailLink = {
  href: 'mailto:simon.kjellberg@gmail.com',
}

const LandingLinks = () => (
  <div>
    <h2>links</h2>
    <p>
      <small>[github](<a {...githubLink}>{githubLink.href}</a>)</small>
      <br />
      <small>[email](<a {...emailLink}>{emailLink.href}</a>)</small>
    </p>
  </div>
)

export default LandingLinks
