// @flow strict
import * as React from 'react'
import Head from 'next/head'
import styled from '@emotion/styled'
import { theme } from 'styled-tools'

import Header from './Header'

const Wrapper = styled('div')`
  font: 100%/1.5 Iosevka, monospace;
  color: ${theme('color.primary')};
`

const Content = styled('div')`
  margin: 0 auto;
  max-width: ${theme('page.maxWidth')};
  padding: 0 0.9375rem 1.875rem;
  padding-top: 0;
`

type Props = {
  siteTitle: string,
  siteDescription: string,
  children?: React.Node,
}

const Page = ({ children, siteTitle, siteDescription }: Props) => (
  <Wrapper>
    <Head>
      <title>{siteTitle}</title>
      <meta property="og:title" content={siteDescription} />
      <meta
        name="description"
        property="og:description"
        content={siteDescription}
      />
    </Head>
    <Header siteTitle={siteTitle} />
    <Content>{children}</Content>
  </Wrapper>
)

Page.defaultProps = {
  siteTitle: 'Simon Kjellberg',
  siteDescription: '',
}

export default Page
