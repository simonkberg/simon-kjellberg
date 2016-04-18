import React, { Component, PropTypes } from 'react'
import connectToStores from 'alt-utils/lib/connectToStores'
import WakaTimeStore from 'stores/WakaTimeStore'

const { array } = PropTypes

class Stats extends Component {
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
          {stats.map(({name, percent}) => {
            return (
              <li key={name}>{name} ({percent}%)</li>
            )
          })}
        </ul>
      )
    }

    return <p>Fetching...</p>
  }

  render () {
    return (
      <div>
        <h2>currently coding in</h2>
        {this.renderStats()}
      </div>
    )
  }
}

export default connectToStores(Stats)
