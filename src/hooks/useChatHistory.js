import * as React from 'react'
import { useQuery } from 'react-apollo'

import subscribeToChatMessageAdded from '../utils/subscribeToChatMessageAdded'
import subscribeToChatMessageEdited from '../utils/subscribeToChatMessageEdited'
import subscribeToChatMessageDeleted from '../utils/subscribeToChatMessageDeleted'
import chatHistoryQuery from '../graphql/ChatHistoryQuery.graphql'

const useChatHistory = opts => {
  const query = useQuery(chatHistoryQuery, opts)

  React.useEffect(() => {
    const unsubscribeFromChatMessageAdded = subscribeToChatMessageAdded(
      query.subscribeToMore
    )
    const unsubscribeFromChatMessageEdited = subscribeToChatMessageEdited(
      query.subscribeToMore
    )
    const subscribeFromChatMessageDeleted = subscribeToChatMessageDeleted(
      query.subscribeToMore
    )

    return () => {
      unsubscribeFromChatMessageAdded()
      unsubscribeFromChatMessageEdited()
      subscribeFromChatMessageDeleted()
    }
  }, [query.subscribeToMore])

  return query
}

export default useChatHistory
