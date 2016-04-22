import React, { Component, PropTypes } from 'react'
import connectToStores from 'alt-utils/lib/connectToStores'
import WakaTimeStore from 'stores/WakaTimeStore'
import Loader from 'shared/components/loader'

const { array } = PropTypes

class LandingStats extends Component {
  static propTypes = {
    stats: array
  }

  static defaultProps = {
    stats: []
  }

  static getStores () {
    return [WakaTimeStore]
  }

  static getPropsFromStores () {
    return WakaTimeStore.getState()
  }

  componentDidMount () {
    WakaTimeStore.fetchStats()
  }

  renderStats () {
    const { stats } = this.props

    if (stats.length) {
      return (
        <ul>
          {stats.map(({name, percent}) => <li key={name}>{name} ({percent}%)</li>)}
        </ul>
      )
    }

    return <Loader text='Fetching...' />
  }

  render () {
    const wakaTimeLink = {
      href: 'https://wakatime.com/@simonkberg',
      target: '_blank'
    }

    return (
      <div>
        <h2>
          currently writing
          <small> (via <a {...wakaTimeLink}>wakatime.com</a>)</small>
        </h2>
        {this.renderStats()}
      </div>
    )
  }
}

export default connectToStores(LandingStats)
