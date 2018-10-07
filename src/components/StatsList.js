// @flow strict
import * as React from 'react'
import { Spring } from 'react-spring'

import withWakaTimeStats, {
  type WakaTimeStatsProps,
} from '../utils/withWakaTimeStats'
import Loader from './Loader'
import * as UnorderedList from './UnorderedList'

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
      {data.wakaTime.stats.map(stat => (
        <Spring
          key={stat.name}
          from={{ percent: 0 }}
          to={{ percent: stat.percent }}
        >
          {value => (
            <UnorderedList.ListItem>
              {stat.name} ({value.percent.toFixed(2)}
              %)
            </UnorderedList.ListItem>
          )}
        </Spring>
      ))}
    </UnorderedList.List>
  )
}
export default withWakaTimeStats(StatsList)
