import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import { Motion, spring, presets } from 'react-motion'
import Loader from 'shared/components/loader'
import { loadStats } from 'actions'

const { array, func } = PropTypes

class LandingStats extends Component {
  static propTypes = {
    stats: array,
    dispatch: func
  }

  static defaultProps = {
    stats: []
  }

  componentDidMount () {
    const { dispatch } = this.props

    dispatch(loadStats())
  }

  renderPercent (percent) {
    const target = spring(percent, presets.noWobble)

    return (
      <Motion defaultStyle={{count: 0}} style={{count: target}}>
        {({count}) => <span>{count.toFixed(2)}</span>}
      </Motion>
    )
  }

  renderStats () {
    const { stats } = this.props

    if (stats.length) {
      return (
        <ul>
          {stats.map(({name, percent}) =>
            <li key={name}>{name} ({this.renderPercent(percent)}%)</li>)}
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

export default connect((state) => {
  return {
    stats: state.stats.data
  }
})(LandingStats)
