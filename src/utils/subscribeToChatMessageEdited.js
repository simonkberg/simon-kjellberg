import chatMessageEditedSubscription from '../graphql/ChatMessageEditedSubscription.graphql'

const updateQuery = (prev, { subscriptionData }) => {
  if (
    subscriptionData != null &&
    subscriptionData.data != null &&
    subscriptionData.data.chatMessageEdited != null
  ) {
    const prevHistory = prev?.chat?.history ?? []
    const { chatMessage } = subscriptionData.data.chatMessageEdited

    switch (chatMessage.__typename) {
      case 'ChatMessage': {
        const prevMessageIndex = prevHistory.findIndex(
          prevMessage => prevMessage.ts === chatMessage.ts
        )

        if (prevMessageIndex !== -1) {
          const prevHistoryCopy = [...prevHistory]
          const prevMessage = prevHistoryCopy[prevMessageIndex]

          prevHistoryCopy[prevMessageIndex] = {
            ...prevMessage,
            ...chatMessage,
          }

          return {
            ...prev,
            chat: {
              ...prev?.chat,
              history: prevHistoryCopy,
            },
          }
        }

        break
      }

      case 'ChatMessageReply': {
        const prevThreadIndex = prevHistory.findIndex(
          prevMessage => prevMessage.ts === chatMessage.thread_ts
        )

        if (prevThreadIndex !== -1) {
          const prevHistoryCopy = [...prevHistory]
          const prevThread = prevHistoryCopy[prevThreadIndex]
          const prevReplies = prevThread?.replies ?? []
          const prevRepliesCopy = [...prevReplies]
          const prevReplyIndex = prevRepliesCopy.findIndex(
            prevReply => prevReply.ts === chatMessage.ts
          )

          if (prevReplyIndex !== -1) {
            const prevReply = prevRepliesCopy[prevReplyIndex]

            prevRepliesCopy[prevReplyIndex] = {
              ...prevReply,
              ...chatMessage,
            }

            prevHistoryCopy[prevThreadIndex] = {
              ...prevThread,
              replies: prevRepliesCopy,
            }

            return {
              ...prev,
              chat: {
                ...prev?.chat,
                history: prevHistoryCopy,
              },
            }
          }
        }

        break
      }

      // no default
    }
  }

  return prev
}

const subscribeToChatMessageEdited = subscribeToMore =>
  subscribeToMore({ document: chatMessageEditedSubscription, updateQuery })

export default subscribeToChatMessageEdited
