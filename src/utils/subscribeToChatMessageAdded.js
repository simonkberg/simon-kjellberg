import chatMessageAddedSubscription from '../graphql/ChatMessageAddedSubscription.graphql'

const updateQuery = (prev, { subscriptionData }) => {
  if (
    subscriptionData != null &&
    subscriptionData.data != null &&
    subscriptionData.data.chatMessageAdded != null
  ) {
    const prevHistory = prev?.chat?.history ?? []
    const { chatMessage } = subscriptionData.data.chatMessageAdded

    switch (chatMessage.__typename) {
      case 'ChatMessage': {
        const newHistory = prevHistory.filter(
          prevMessage => prevMessage.ts !== chatMessage.ts
        )

        newHistory.push(chatMessage)

        return {
          ...prev,
          chat: {
            ...prev?.chat,
            history: newHistory,
          },
        }
      }

      case 'ChatMessageReply': {
        const prevThreadIndex = prevHistory.findIndex(
          prevMessage => prevMessage.ts === chatMessage.thread_ts
        )

        if (prevThreadIndex !== -1) {
          const prevHistoryCopy = [...prevHistory]
          const prevThread = prevHistoryCopy[prevThreadIndex]
          const prevReplies = prevThread?.replies ?? []
          const newReplies = prevReplies.filter(
            prevReply => prevReply.ts !== chatMessage.ts
          )

          newReplies.push(chatMessage)

          prevHistoryCopy[prevThreadIndex] = {
            ...prevThread,
            replies: newReplies,
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
      // no default
    }
  }

  return prev
}

const subscribeToChatMessageAdded = subscribeToMore =>
  subscribeToMore({ document: chatMessageAddedSubscription, updateQuery })

export default subscribeToChatMessageAdded
