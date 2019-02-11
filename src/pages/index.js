// @flow strict
import * as React from 'react'
import getConfig from 'next/config'
import dynamic from 'next/dynamic'
import Page from '../components/Page'
import About from '../components/About.bs'
import Stats from '../components/Stats'
import Links from '../components/Links'

const Chat = dynamic(() => import('../components/Chat'))

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
