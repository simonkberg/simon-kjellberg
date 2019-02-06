// @flow strict
import * as React from 'react'
import { useSprings, animated } from 'react-spring'

import withWakaTimeStats, {
  type WakaTimeStatsProps,
} from '../utils/withWakaTimeStats'
import Loader from './Loader'
import * as UnorderedList from './UnorderedList'

const AnimatedListItem = UnorderedList.ListItem.withComponent(animated('li'))

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

const StatsList = ({ loading, error, data }: WakaTimeStatsProps) => {
  if (loading) {
    return <Loader />
  }

  if (error || data == null || data.wakaTime == null) {
    return <p>Stats are temporarily unavailable :(</p>
  }

  if (data.wakaTime.stats.length === 0) {
    return (
      <p>
        <em>
          Oops! Looks like the plugins is broken, or maybe I'm on vacation?
          Nevertheless, the language statistics are currently empty.
        </em>
      </p>
    )
  }

  return (
    <UnorderedList.List>
      <StatsListItems stats={data.wakaTime.stats} />
    </UnorderedList.List>
  )
}
export default withWakaTimeStats(StatsList)
