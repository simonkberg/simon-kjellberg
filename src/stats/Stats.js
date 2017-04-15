import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Loader from 'shared/components/loader'

import * as statsActions from './statsActions'
import { getSortedStatsIds } from './statsSelectors'
import StatsItem from './StatsItem'

const { array, func } = PropTypes

export class Stats extends PureComponent {
  static propTypes = {
    statsIds: array,
    loadStats: func.isRequired,
  }

  static defaultProps = {
    statsIds: [],
  }

  componentDidMount () {
    this.props.loadStats()
  }

  render () {
    const { statsIds } = this.props

    if (!statsIds.length) {
      return <Loader />
    }

    return (
      <ul>
        {statsIds.map(id => <StatsItem key={id} id={id} />)}
      </ul>
    )
  }
}

const mapStateToProps = state => ({
  statsIds: getSortedStatsIds(state),
})

const mapDispatchToProps = dispatch =>
  bindActionCreators({ ...statsActions }, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(Stats)
