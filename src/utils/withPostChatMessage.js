// @flow strict
import * as React from 'react'
import { Mutation } from 'react-apollo'
import setDisplayName from 'recompose/setDisplayName'
import wrapDisplayName from 'recompose/wrapDisplayName'
import type { MutationFunction, MutationResult } from 'react-apollo'

import chatHistoryQuery from '../graphql/ChatHistoryQuery.graphql'
import postChatMessageMutation from '../graphql/PostChatMessageMutation.graphql'
import type { ChatHistoryQuery } from '../graphql/ChatHistoryQuery'
import type {
  PostChatMessageMutation,
  PostChatMessageMutationVariables,
} from '../graphql/PostChatMessageMutation'

export type PostChatMessageProps = {
  postChatMessage: MutationFunction<
    PostChatMessageMutation,
    PostChatMessageMutationVariables
  >,
  postChatMessageResult: MutationResult<PostChatMessageMutation>,
}

const postChatMessageMutationUpdate = (cache, { data }) => {
  if (data && data.postChatMessage) {
    const cacheData = cache.readQuery<ChatHistoryQuery>({
      query: chatHistoryQuery,
    })

    const { chatMessage } = data.postChatMessage
    const prevHistory = cacheData?.chat?.history ?? []

    cache.writeQuery({
      query: chatHistoryQuery,
      data: {
        ...cacheData,
        chat: {
          ...cacheData?.chat,
          history: prevHistory
            .filter(prevMessage => prevMessage.ts !== chatMessage.ts)
            .concat(chatMessage),
        },
      },
    })
  }
}

class PostChatMessageMutationComponent extends Mutation<
  PostChatMessageMutation,
  PostChatMessageMutationVariables
> {}

const withPostChatMessage = <Props: {}>(
  BaseComponent: React.ComponentType<Props>
): React.ComponentType<$Diff<Props, { ...PostChatMessageProps }>> => {
  const baseFactory = React.createFactory(BaseComponent)
  const chatHistoryFactory = React.createFactory(
    PostChatMessageMutationComponent
  )

  const WithPostChatMessage = baseProps =>
    chatHistoryFactory({
      mutation: postChatMessageMutation,
      update: postChatMessageMutationUpdate,
      children: (postChatMessage, postChatMessageResult) =>
        baseFactory({ ...baseProps, postChatMessage, postChatMessageResult }),
    })

  if (process.env.NODE_ENV !== 'production') {
    return setDisplayName(
      wrapDisplayName(BaseComponent, 'withPostChatMessage')
    )(WithPostChatMessage)
  }

  return WithPostChatMessage
}

export default withPostChatMessage
