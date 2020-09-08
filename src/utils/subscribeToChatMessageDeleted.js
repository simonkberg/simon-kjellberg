import chatMessageDeletedSubscription from '../graphql/ChatMessageDeletedSubscription.graphql'

const updateQuery = (prev, { subscriptionData }) => {
  if (
    subscriptionData != null &&
    subscriptionData.data != null &&
    subscriptionData.data.chatMessageDeleted != null
  ) {
    const prevHistory = prev?.chat?.history ?? []
    const { chatMessage } = subscriptionData.data.chatMessageDeleted

    switch (chatMessage.__typename) {
      case 'ChatMessage': {
        return {
          ...prev,
          chat: {
            ...prev?.chat,
            history: prevHistory.filter(
              prevMessage => prevMessage.ts !== chatMessage.ts
            ),
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

          prevHistoryCopy[prevThreadIndex] = {
            ...prevThread,
            replies: prevReplies.filter(
              prevReply => prevReply.ts !== chatMessage.ts
            ),
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
    }
  }

  return prev
}

const subscribeToChatMessageDeleted = subscribeToMore =>
  subscribeToMore({ document: chatMessageDeletedSubscription, updateQuery })

export default subscribeToChatMessageDeleted
