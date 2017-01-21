import { createSelector as ca } from 'reselect'
import cas from 'helpers/createArgumentedSelector'

const getChatOpenState = state =>
  state.getIn(['chat', 'open'])

export const getChatOpen = ca(
  getChatOpenState,
  open => !!open
)

const getChatMessagesLoadingState = state =>
  state.getIn(['chat', 'messages', 'loading'])

export const getChatMessagesLoading = ca(
  getChatMessagesLoadingState,
  loading => !!loading
)

const getChatUsersLoadingState = state =>
  state.getIn(['chat', 'users', 'loading'])

export const getChatUsersLoading = ca(
  getChatUsersLoadingState,
  loading => !!loading
)

export const getChatLoading = ca(
  getChatMessagesLoadingState,
  getChatUsersLoadingState,
  (messages, users) => !!(messages || users)
)

const getChatMessageIdsState = state =>
  state.getIn(['chat', 'messages', 'ids'])

export const getChatMessageIds = ca(
  getChatMessageIdsState,
  ids => ids.sort().toArray()
)

const getChatMessagesState = state =>
  state.getIn(['chat', 'entities', 'messages'])

export const getChatMessages = ca(
  getChatMessagesState,
  entities => entities.toJS()
)

const getChatUsersIdsState = state =>
  state.getIn(['chat', 'users', 'ids'])

export const getChatUsersIds = ca(
  getChatUsersIdsState,
  ids => ids.toArray()
)

const getChatUsersState = state =>
  state.getIn(['chat', 'entities', 'users'])

export const getChatUsers = ca(
  getChatUsersState,
  entities => entities.toJS()
)

const getChatMessageState = (state, id) =>
  state.getIn(['chat', 'entities', 'messages', id])

export const getChatMessage = cas(
  getChatMessageState,
  entity => entity.toObject()
)

const getChatUserState = (state, id) =>
  state.getIn(['chat', 'entities', 'users', id])

export const getChatUser = cas(
  getChatUserState,
  entity => entity.toObject()
)
