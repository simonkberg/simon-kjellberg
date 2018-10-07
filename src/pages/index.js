// @flow strict
import * as React from 'react'
import getConfig from 'next/config'
import Page from '../components/Page'
import About from '../components/About'
import Stats from '../components/Stats'
import Chat from '../components/Chat'
import Links from '../components/Links'

const {
  publicRuntimeConfig: { siteTitle, siteDescription },
} = getConfig()

const IndexPage = () => (
  <Page siteTitle={siteTitle} siteDescription={siteDescription}>
    <About />
    <Stats />
    <Links />
    <Chat />
  </Page>
)

export default IndexPage
