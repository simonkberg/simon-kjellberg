import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import { Motion, spring, presets } from 'react-motion'
import { makeGetStatsEntity } from './statsSelectors'

const StatsItem = ({ id, name, percent }) => {
  const target = spring(percent, presets.noWobble)

  return (
    <li>
      {name}{' '}
      <Motion defaultStyle={{count: 0}} style={{count: target}}>
        {({count}) => <span>({count.toFixed(2)}%)</span>}
      </Motion>
    </li>
  )
}

StatsItem.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string,
  percent: PropTypes.number,
}

const makeMapStateToProps = () => {
  const getStatsEntity = makeGetStatsEntity()
  return (state, props) => ({
    ...getStatsEntity(state, props),
  })
}

export default connect(makeMapStateToProps)(StatsItem)
