import * as React from 'react'
import getConfig from 'next/config'
import NextDocument, { Head, Main, NextScript } from 'next/document'
import { oneLineTrim } from 'common-tags'
import { extractCritical } from 'emotion-server-v9'

const { serverRuntimeConfig } = getConfig()

const gtmScript = oneLineTrim`
  (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','${serverRuntimeConfig.gtmId}');
`

export default class Document extends NextDocument {
  static getInitialProps({ req, renderPage }) {
    const { fragmentTypes, newrelic } = req
    const page = renderPage()
    const browserTimingHeader =
      newrelic != null
        ? newrelic
            .getBrowserTimingHeader()
            .replace(/^<script[\s]*[^>]*>([\s\S]*)<\/[\s]*script[\s]*>$/, '$1')
        : undefined
    const styles = extractCritical(page.html)

    return { ...page, ...styles, fragmentTypes, browserTimingHeader }
  }

  render() {
    return (
      <html lang="en">
        <Head>
          <link rel="manifest" href="/manifest.json" />
          <link rel="shortcut icon" href="/favicon.ico" />
          <meta name="theme-color" content="#000000" />
          {this.props.browserTimingHeader != null && (
            <script
              dangerouslySetInnerHTML={{
                __html: this.props.browserTimingHeader,
              }}
            />
          )}
          <script dangerouslySetInnerHTML={{ __html: gtmScript }} />
          <style dangerouslySetInnerHTML={{ __html: this.props.css }} />
        </Head>
        <body>
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${serverRuntimeConfig.gtmId}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
          <Main />
          <script
            dangerouslySetInnerHTML={{
              __html: `window.__EMOTION_CRITICAL_CSS_IDS__ = ${JSON.stringify(
                this.props.ids
              )};`,
            }}
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `window.__FRAGMENT_TYPES__ = ${JSON.stringify(
                this.props.fragmentTypes
              )};`,
            }}
          />
          <NextScript />
        </body>
      </html>
    )
  }
}
