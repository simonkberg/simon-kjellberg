import React from 'react'
import Stats from 'stats'

const wakaTimeLink = {
  href: 'https://wakatime.com/@simonkberg',
  target: '_blank',
}

const LandingStats = () => (
  <div>
    <h2>
      currently writing
      <small> (via <a {...wakaTimeLink}>wakatime.com</a>)</small>
    </h2>
    <Stats />
  </div>
)

export default LandingStats
