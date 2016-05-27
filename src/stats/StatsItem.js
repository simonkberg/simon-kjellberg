import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import { Motion, spring, presets } from 'react-motion'

const StatsItem = ({ id, percent }) => {
  const target = spring(percent, presets.noWobble)

  return (
    <li>
      {id}{' '}
      <Motion defaultStyle={{count: 0}} style={{count: target}}>
        {({count}) => <span>({count.toFixed(2)}%)</span>}
      </Motion>
    </li>
  )
}

StatsItem.propTypes = {
  id: PropTypes.string,
  percent: PropTypes.number
}

const mapStateToProps = (state, { id }) => ({
  percent: state.getIn(['stats', 'entities', id, 'percent'])
})

export default connect(mapStateToProps)(StatsItem)
