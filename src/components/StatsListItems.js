import * as React from 'react'
import { useSprings, animated } from 'react-spring'

import UnorderedListItem from './UnorderedListItem.bs'

const AnimatedListItem = animated(UnorderedListItem)

const StatsListItems = ({ stats }) => {
  const springs = useSprings(
    stats.length,
    stats.map(item => ({
      from: { percent: 0 },
      to: { percent: item.percent },
    }))
  )

  return springs.map((props, index) => {
    const { name } = stats[index]

    return (
      <AnimatedListItem key={name}>
        {props.percent.interpolate(n => `${name} (${n.toFixed(2)}%)`)}
      </AnimatedListItem>
    )
  })
}

export default StatsListItems
