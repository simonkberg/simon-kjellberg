// @flow strict
import * as React from 'react'
import NextApp from 'next/app'
import Head from 'next/head'
import { hydrate } from 'emotion'
import { Global, css } from '@emotion/core'
import { ApolloProvider } from 'react-apollo'
import { ThemeProvider } from 'emotion-theming'
import sanitize from 'sanitize.css'

import iosevkaWoff from '../assets/iosevka-ss08-regular.woff'
import iosevkaWoff2 from '../assets/iosevka-ss08-regular.woff2'
import iosevkaItalicWoff from '../assets/iosevka-ss08-italic.woff'
import iosevkaItalicWoff2 from '../assets/iosevka-ss08-italic.woff2'
import iosevkaBoldWoff from '../assets/iosevka-ss08-bold.woff'
import iosevkaBoldWoff2 from '../assets/iosevka-ss08-bold.woff2'
import iosevkaBoldItalicWoff from '../assets/iosevka-ss08-bolditalic.woff'
import iosevkaBoldItalicWoff2 from '../assets/iosevka-ss08-bolditalic.woff2'
import facebookShareImage from '../assets/share.png'
import ensureTrailingSlash from '../utils/ensureTrailingSlash'
import withApollo from '../utils/withApollo'
import Theme from '../Theme.bs'

const globalStyles = css`
  ${sanitize};

  @font-face {
    font-family: 'Iosevka';
    font-display: fallback;
    src: url('${iosevkaWoff2}') format('woff2'),
      url('${iosevkaWoff}') format('woff');
  }

  @font-face {
    font-family: 'Iosevka';
    font-style: italic;
    font-display: fallback;
    src: url('${iosevkaItalicWoff2}') format('woff2'),
      url('${iosevkaItalicWoff}') format('woff');
  }

  @font-face {
    font-family: 'Iosevka';
    font-weight: 700;
    font-display: fallback;
    src: url('${iosevkaBoldWoff2}') format('woff2'),
      url('${iosevkaBoldWoff}') format('woff');
  }

  @font-face {
    font-family: 'Iosevka';
    font-style: italic;
    font-weight: 700;
    font-display: fallback;
    src: url('${iosevkaBoldItalicWoff2}') format('woff2'),
      url('${iosevkaBoldItalicWoff}') format('woff');
  }
`

class App extends NextApp {
  static async getInitialProps(ctx: $FlowFixMe) {
    const appProps = await NextApp.getInitialProps(ctx)
    const { req } = ctx.ctx

    const canonicalUrl = ensureTrailingSlash(
      req != null
        ? `${req.protocol}://${req.get('host')}${req.path}`
        : `${window.location.origin}${window.location.pathname}`
    )

    return { ...appProps, canonicalUrl }
  }

  componentDidMount() {
    if (
      typeof window !== 'undefined' &&
      window.__EMOTION_CRITICAL_CSS_IDS__ != null
    ) {
      hydrate(window.__EMOTION_CRITICAL_CSS_IDS__)
    }
  }

  render() {
    const { Component, pageProps, apolloClient, canonicalUrl } = this.props

    return (
      <>
        <Global styles={globalStyles} />
        <Head>
          <meta
            name="viewport"
            key="viewport"
            content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
          />
          <meta property="og:type" content="website" key="og:type" />
          <meta property="og:url" content={canonicalUrl} key="og:url" />
          <meta
            property="og:image"
            content={facebookShareImage}
            key="og:image"
          />
          <link rel="canonical" href={canonicalUrl} key="canonical" />
          <link
            rel="preload"
            href={iosevkaWoff2}
            as="font"
            type="font/woff2"
            crossOrigin="anonymous"
            key={iosevkaWoff2}
          />
          <link
            rel="preload"
            href={iosevkaItalicWoff2}
            as="font"
            type="font/woff2"
            crossOrigin="anonymous"
            key={iosevkaItalicWoff2}
          />
          <link
            rel="preload"
            href={iosevkaBoldWoff2}
            as="font"
            type="font/woff2"
            crossOrigin="anonymous"
            key={iosevkaBoldWoff2}
          />
          <link
            rel="preload"
            href={iosevkaBoldItalicWoff2}
            as="font"
            type="font/woff2"
            crossOrigin="anonymous"
            key={iosevkaBoldItalicWoff2}
          />
        </Head>
        <ApolloProvider client={apolloClient}>
          <ThemeProvider theme={Theme}>
            <Component {...pageProps} />
          </ThemeProvider>
        </ApolloProvider>
      </>
    )
  }
}

export default withApollo(App)
