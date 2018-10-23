// @flow strict
import * as React from 'react'
import getConfig from 'next/config'
import Heading from './Heading'
import Subtitle from './Subtitle'
import Link from './Link'

const {
  publicRuntimeConfig: { siteDescription },
} = getConfig()

const About = () => (
  <section>
    <Heading level="2">
      About <Subtitle>(Location: Stockholm, Sweden)</Subtitle>
    </Heading>
    <p>{siteDescription}</p>
    <p>
      Working as a consultant via my own company,{' '}
      <Link href="https://shebang.consulting">Shebang</Link>.
    </p>
  </section>
)

export default About
