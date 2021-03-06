import * as React from 'react'
import getConfig from 'next/config'
import dynamic from 'next/dynamic'

import Page from '../components/Page.bs'
import About from '../components/About.bs'
import Stats from '../components/Stats.bs'
import Links from '../components/Links.bs'

const Chat = dynamic(() => import('../components/Chat.bs'))

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
