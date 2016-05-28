import { createSelector } from 'reselect'

const getChatOpenState = state =>
  state.getIn(['chat', 'open'])

export const getChatOpen = createSelector(
  getChatOpenState,
  open => !!open
)

const getChatMessagesLoadingState = state =>
  state.getIn(['chat', 'messages', 'loading'])

export const getChatMessagesLoading = createSelector(
  getChatMessagesLoadingState,
  loading => !!loading
)

const getChatUsersLoadingState = state =>
  state.getIn(['chat', 'users', 'loading'])

export const getChatUsersLoading = createSelector(
  getChatUsersLoadingState,
  loading => !!loading
)

export const getChatLoading = createSelector(
  getChatMessagesLoadingState,
  getChatUsersLoadingState,
  (messages, users) => !!(messages || users)
)

const getChatMessageIdsState = state =>
  state.getIn(['chat', 'messages', 'ids'])

export const getChatMessageIds = createSelector(
  getChatMessageIdsState,
  ids => ids.sort().toArray()
)

const getChatMessageEntititesState = state =>
  state.getIn(['chat', 'entities', 'messages'])

export const getChatMessageEntities = createSelector(
  getChatMessageEntititesState,
  entities => entities.toJS()
)

const getChatUsersIdsState = state =>
  state.getIn(['chat', 'users', 'ids'])

export const getChatUsersIds = createSelector(
  getChatUsersIdsState,
  ids => ids.toArray()
)

const getChatUserEntititesState = state =>
  state.getIn(['chat', 'entities', 'users'])

export const getChatUserEntities = createSelector(
  getChatUserEntititesState,
  entities => entities.toJS()
)
