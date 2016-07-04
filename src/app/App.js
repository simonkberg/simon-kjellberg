import React, { Component, PropTypes } from 'react'
import Helmet from 'react-helmet'

import favicons, { appleTouchIcons } from 'helpers/favicon'
import withStyles from 'helpers/withStyles'
import withUrl from 'helpers/withUrl'

import ShareImage from 'shared/assets/share.png'
import Styles from './App.css'

import Chat from 'chat'

const { node, object, string } = PropTypes

export class App extends Component {
  static propTypes = {
    children: node,
    styles: object,
    baseUrl: string,
    url: string,
  }

  render () {
    const { children, baseUrl, url, styles } = this.props

    const head = {
      htmlAttributes: { lang: 'en', itemscope: true, itemtype: 'http://schema.org/WebPage' },
      titleTemplate: 'Simon Kjellberg » %s',
      defaultTitle: 'Simon Kjellberg',
      meta: [
        { name: 'theme-color', content: '#000000' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'title', property: 'og:title', itemprop: 'name', content: 'Simon Kjellberg' },
        { name: 'description', property: 'og:description', itemprop: 'description', content: 'Creative full stack developer located in Stockholm, Sweden.' },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', itemprop: 'url', content: url },
        { property: 'og:image', itemprop: 'image', content: `${baseUrl}/${ShareImage}` },
        { property: 'fb:app_id', content: '1717386788525340' },
      ],
      link: [
        ...appleTouchIcons([152, 144, 120, 114, 72, 57]),
        ...favicons([196, 32, 16]),
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css?family=Fira+Mono:400,700' },
        { rel: 'canonical', href: url },
      ],
    }

    return (
      <div className={styles.app}>
        <Helmet {...head} />
        {children}
        <Chat />
      </div>
    )
  }
}

const WithStyles = withStyles(Styles)(App)
const WithUrl = withUrl(WithStyles)

export default WithUrl
