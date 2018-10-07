// @flow strict
import * as React from 'react'
import { theme } from 'styled-tools'
import styled from 'react-emotion'

import Heading from './Heading'
import Link from './Link'
import StatsList from './StatsList'

const Subtitle = styled('small')`
  color: ${theme('color.muted')};
  font-weight: normal;
`

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
