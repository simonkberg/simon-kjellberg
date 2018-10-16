// @flow strict
import * as React from 'react'
import { Query } from 'react-apollo'
import setDisplayName from 'recompose/setDisplayName'
import wrapDisplayName from 'recompose/wrapDisplayName'
import type { QueryRenderProps } from 'react-apollo'

import chatHistoryQuery from '../graphql/ChatHistoryQuery.graphql'
import type { ChatHistoryQuery } from '../graphql/ChatHistoryQuery'

export type ChatHistoryProps = QueryRenderProps<ChatHistoryQuery>

class ChatHistoryQueryComponent extends Query<ChatHistoryQuery, {}> {}

const withChatHistory = <Props: {}>(
  BaseComponent: React.ComponentType<Props>
): React.ComponentType<$Diff<Props, { ...ChatHistoryProps }>> => {
  const baseFactory = React.createFactory(BaseComponent)
  const chatHistoryFactory = React.createFactory(ChatHistoryQueryComponent)

  const WithChatHistory = baseProps =>
    chatHistoryFactory({
      ssr: false,
      query: chatHistoryQuery,
      children: props => baseFactory({ ...baseProps, ...props }),
    })

  if (process.env.NODE_ENV !== 'production') {
    return setDisplayName(wrapDisplayName(BaseComponent, 'withChatHistory'))(
      WithChatHistory
    )
  }

  return WithChatHistory
}

export default withChatHistory
