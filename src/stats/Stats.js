import React, { Component, PropTypes } from 'react'
import shallowCompare from 'react-addons-shallow-compare'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Loader from 'shared/components/loader'

import * as statsActions from './statsActions'
import { getStatsIds } from './statsSelectors'
import StatsItem from './StatsItem'

const { array, func } = PropTypes

export class Stats extends Component {
  static propTypes = {
    statsIds: array,
    loadStats: func.isRequired
  }

  static defaultProps = {
    statsIds: []
  }

  componentDidMount () {
    this.props.loadStats()
  }

  shouldComponentUpdate (nextProps, nextState) {
    return shallowCompare(this, nextProps, nextState)
  }

  render () {
    const { statsIds } = this.props

    if (!statsIds.length) {
      return <Loader text='Fetching...' />
    }

    return (
      <ul>
        {statsIds.map(id => <StatsItem key={id} id={id} />)}
      </ul>
    )
  }
}

const mapStateToProps = (state) => ({
  statsIds: getStatsIds(state)
})

const mapDispatchToProps = (dispatch) =>
  bindActionCreators({...statsActions}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(Stats)
