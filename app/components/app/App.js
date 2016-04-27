import React, { Component, PropTypes } from 'react'
import Helmet from 'react-helmet'

import favicons, { appleTouchIcons } from 'helpers/favicon'
import withUrl from 'helpers/withUrl'
import share from 'shared/assets/share.png'
import styles from './App.css'

const { shape, node, func, string } = PropTypes

class App extends Component {
  static propTypes = {
    context: shape({
      insertCss: func.isRequired
    }),
    children: node,
    baseUrl: string,
    url: string
  }

  static childContextTypes = {
    insertCss: func.isRequired
  }

  getChildContext () {
    const { context } = this.props

    return {
      insertCss: context.insertCss
    }
  }

  componentWillMount () {
    const { insertCss } = this.props.context

    this._removeCss = insertCss(styles, { replace: true })
  }

  componentWillUnmount () {
    this._removeCss()
  }

  render () {
    const { baseUrl, url } = this.props

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
        { property: 'og:image', itemprop: 'image', content: `${baseUrl}/${share}` },
        { property: 'fb:app_id', content: '1717386788525340' }
      ],
      link: [
        ...appleTouchIcons([152, 144, 120, 114, 72, 57]),
        ...favicons([196, 32, 16]),
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css?family=Fira+Mono:400,700' },
        { rel: 'canonical', href: url }
      ]
    }

    return (
      <div className={styles.app}>
        <Helmet {...head} />
        {this.props.children}
      </div>
    )
  }
}

export default withUrl(App)
