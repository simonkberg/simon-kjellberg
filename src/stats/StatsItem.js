import React, { PropTypes } from 'react'
import { Motion, spring, presets } from 'react-motion'

const StatsItem = ({ name, percent }) => {
  const target = spring(percent, presets.noWobble)

  return (
    <li>
      {name}
      <Motion defaultStyle={{count: 0}} style={{count: target}}>
        {({count}) => <span>({count.toFixed(2)}%)</span>}
      </Motion>
    </li>
  )
}

StatsItem.propTypes = {
  name: PropTypes.string,
  percent: PropTypes.number
}

export default StatsItem
