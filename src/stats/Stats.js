import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Loader from 'shared/components/loader'

import * as statsActions from './statsActions'
import * as statsSelectors from './statsSelectors'
import StatsItem from './StatsItem'

const { array, bool, string, func } = PropTypes

export class Stats extends PureComponent {
  static propTypes = {
    ids: array,
    isLoading: bool,
    error: string,
    loadStats: func.isRequired,
  }

  static defaultProps = {
    ids: [],
    isLoading: false,
    error: null,
  }

  componentDidMount() {
    this.props.loadStats()
  }

  render() {
    const { ids, isLoading, error } = this.props

    if (error) {
      return <p>Stats are temporarily unavailable :(</p>
    }

    if (isLoading) {
      return <Loader />
    }

    return (
      <ul>
        {ids.map(id => <StatsItem key={id} id={id} />)}
      </ul>
    )
  }
}

const mapStateToProps = state => ({
  ids: statsSelectors.getSortedStatsIds(state),
  isLoading: statsSelectors.getStatsLoading(state),
  error: statsSelectors.getStatsError(state),
})

const mapDispatchToProps = dispatch =>
  bindActionCreators({ ...statsActions }, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(Stats)
