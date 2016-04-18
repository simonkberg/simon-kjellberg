import React, { Component, PropTypes } from 'react'
import Helmet from 'react-helmet'

import withUrl from 'helpers/withUrl'
import styles from './App.css'

const { shape, node, func } = PropTypes

class App extends Component {
  static propTypes = {
    context: shape({
      insertCss: func.isRequired
    }),
    children: node
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
    const head = {
      htmlAttributes: { lang: 'en' },
      titleTemplate: 'Simon Kjellberg » %s',
      defaultTitle: 'Simon Kjellberg',
      meta: [
        { name: 'theme-color', content: '#fff' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: ';TODO' },
        { property: 'og:type', content: 'website' }
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
