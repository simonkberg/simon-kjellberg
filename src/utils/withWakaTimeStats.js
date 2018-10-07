// @flow strict
import * as React from 'react'
import { Query } from 'react-apollo'
import setDisplayName from 'recompose/setDisplayName'
import wrapDisplayName from 'recompose/wrapDisplayName'
import type { QueryRenderProps } from 'react-apollo'

import chatHistoryQuery from '../graphql/WakaTimeStatsQuery.graphql'
import type { WakaTimeStatsQuery } from '../graphql/WakaTimeStatsQuery'

export type WakaTimeStatsProps = QueryRenderProps<WakaTimeStatsQuery>

class WakaTimeStatsQueryComponent extends Query<WakaTimeStatsQuery, {}> {}

const withWakaTimeStats = <Props: {}>(
  BaseComponent: React.ComponentType<Props>
): React.ComponentType<$Diff<Props, { ...WakaTimeStatsProps }>> => {
  const baseFactory = React.createFactory(BaseComponent)
  const chatHistoryFactory = React.createFactory(WakaTimeStatsQueryComponent)

  const WithWakaTimeStats = baseProps =>
    chatHistoryFactory({
      query: chatHistoryQuery,
      children: props => baseFactory({ ...baseProps, ...props }),
    })

  if (process.env.NODE_ENV !== 'production') {
    return setDisplayName(wrapDisplayName(BaseComponent, 'withWakaTimeStats'))(
      WithWakaTimeStats
    )
  }

  return WithWakaTimeStats
}

export default withWakaTimeStats
