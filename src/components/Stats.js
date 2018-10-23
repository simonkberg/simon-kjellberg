// @flow strict
import * as React from 'react'

import Heading from './Heading'
import Subtitle from './Subtitle'
import Link from './Link'
import StatsList from './StatsList'

const Stats = () => (
  <section>
    <Heading level="2">
      Currently writing{' '}
      <Subtitle>
        (Via{' '}
        <Link
          href="https://wakatime.com/@simonkberg"
          target="_blank"
          rel="noopener noreferrer"
        >
          WakaTime
        </Link>
        )
      </Subtitle>
    </Heading>
    <StatsList />
  </section>
)

export default Stats
