import { useMutation } from 'react-apollo'

import chatHistoryQuery from '../graphql/ChatHistoryQuery.graphql'
import postChatMessageMutation from '../graphql/PostChatMessageMutation.graphql'

const postChatMessageMutationUpdate = (cache, { data }) => {
  if (data && data.postChatMessage) {
    const cacheData = cache.readQuery({
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

const usePostChatMessage = opts =>
  useMutation(postChatMessageMutation, {
    update: postChatMessageMutationUpdate,
    ...opts,
  })

export default usePostChatMessage
