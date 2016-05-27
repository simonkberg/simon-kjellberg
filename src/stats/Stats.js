import React, { Component, PropTypes } from 'react'
import shallowCompare from 'react-addons-shallow-compare'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Loader from 'shared/components/loader'

import * as statsActions from './statsActions'
import StatsItem from './StatsItem'

const { array, func } = PropTypes

export class Stats extends Component {
  static propTypes = {
    stats: array,
    loadStats: func.isRequired
  }

  static defaultProps = {
    stats: []
  }

  componentDidMount () {
    this.props.loadStats()
  }

  shouldComponentUpdate (nextProps, nextState) {
    return shallowCompare(this, nextProps, nextState)
  }

  render () {
    const { stats } = this.props

    if (!stats.length) {
      return <Loader text='Fetching...' />
    }

    return (
      <ul>
        {stats.map((props) => <StatsItem key={props.name} {...props} />)}
      </ul>
    )
  }
}

const mapStateToProps = (state) => ({ stats: state.getIn(['stats', 'data']).toJS() })

const mapDispatchToProps = (dispatch) =>
  bindActionCreators({...statsActions}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(Stats)
