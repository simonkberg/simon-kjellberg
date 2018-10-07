// @flow strict
import * as React from 'react'
import getConfig from 'next/config'
import Heading from './Heading'

const {
  publicRuntimeConfig: { siteDescription },
} = getConfig()

const About = () => (
  <section>
    <Heading level="2">About</Heading>
    <p>{siteDescription}</p>
  </section>
)

export default About
