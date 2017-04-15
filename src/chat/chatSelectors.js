import { createSelector as ca } from 'reselect'
import cas from 'helpers/createArgumentedSelector'

const getChatMessagesLoadingState = state =>
  state.getIn(['chat', 'messages', 'loading'])

const getChatUsersLoadingState = state =>
  state.getIn(['chat', 'users', 'loading'])

const getChatMessageIdsState = state =>
  state.getIn(['chat', 'messages', 'ids']).sort()

const getChatMessagesState = state =>
  state.getIn(['chat', 'entities', 'messages'])

const getChatUsersIdsState = state => state.getIn(['chat', 'users', 'ids'])

const getChatUsersState = state => state.getIn(['chat', 'entities', 'users'])

const getChatMessageState = (state, id) =>
  state.getIn(['chat', 'entities', 'messages', id])

const getChatUserState = (state, id) =>
  state.getIn(['chat', 'entities', 'users', id])

export const getChatMessagesLoading = ca(
  getChatMessagesLoadingState,
  loading => !!loading
)

export const getChatUsersLoading = ca(
  getChatUsersLoadingState,
  loading => !!loading
)

export const getChatLoading = ca(
  getChatMessagesLoadingState,
  getChatUsersLoadingState,
  (messages, users) => !!(messages || users)
)

export const getChatMessageIds = ca(getChatMessageIdsState, ids =>
  ids.toArray()
)

export const getMainChatMessageIds = ca(
  getChatMessageIdsState,
  getChatMessagesState,
  (ids, entries) =>
    ids
      .filter(ts => {
        const threadTs = entries.getIn([ts, 'thread_ts'])
        return !threadTs || threadTs === ts
      })
      .toArray()
)

export const getChatThreadIds = cas(getChatMessageState, message =>
  message.get('replies').toArray()
)

export const getChatMessages = ca(getChatMessagesState, entities =>
  entities.toJS()
)

export const getChatUsersIds = ca(getChatUsersIdsState, ids => ids.toArray())

export const getChatUsers = ca(getChatUsersState, entities => entities.toJS())

export const getChatMessage = cas(getChatMessageState, entity => entity.toJS())

export const getChatUser = cas(getChatUserState, entity => entity.toJS())
