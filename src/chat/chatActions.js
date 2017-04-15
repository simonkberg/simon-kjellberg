import { normalize } from 'normalizr'
import { getBaseUrl } from 'app/appSelectors'
import { getChatMessageIds, getChatUsersIds } from './chatSelectors'
import * as Schema from './chatSchema'

export const FETCH_CHAT_HISTORY = 'FETCH_CHAT_HISTORY'
export const FETCH_CHAT_HISTORY_SUCCESS = 'FETCH_CHAT_HISTORY_SUCCESS'
export const FETCH_CHAT_HISTORY_ERROR = 'FETCH_CHAT_HISTORY_ERROR'

export const loadChatHistory = () => (dispatch, getState) => {
  const messageIds = getChatMessageIds(getState())

  if (!messageIds.length) {
    return fetchChatHistory()(dispatch, getState)
  }
}

export const fetchChatHistory = () => (dispatch, getState) => {
  dispatch({ type: FETCH_CHAT_HISTORY })

  const baseUrl = getBaseUrl(getState())

  return fetch(`${baseUrl}/api/chat/history`)
    .then(res => res.json())
    .then(res => {
      if (res.ok) {
        const messages = normalize(res.messages, Schema.CHAT_MESSAGES)

        return dispatch(fetchChatHistorySuccess(messages))
      }

      dispatch(fetchChatHistoryError(res.message))
    })
    .catch(err => dispatch(fetchChatHistoryError(err.message)))
}

export const fetchChatHistorySuccess = response => ({
  type: FETCH_CHAT_HISTORY_SUCCESS,
  response,
})

export const fetchChatHistoryError = error => ({
  type: FETCH_CHAT_HISTORY_ERROR,
  error,
})

export const ADD_CHAT_MESSAGE = 'ADD_CHAT_MESSAGE'
export const UPDATE_CHAT_MESSAGE = 'UPDATE_CHAT_MESSAGE'
export const REMOVE_CHAT_MESSAGE = 'REMOVE_CHAT_MESSAGE'

export const addChatMessage = message => ({
  type: ADD_CHAT_MESSAGE,
  response: normalize(message, Schema.CHAT_MESSAGE),
})

export const updateChatMessage = message => ({
  type: UPDATE_CHAT_MESSAGE,
  response: normalize(message, Schema.CHAT_MESSAGE),
})

export const removeChatMessage = ({ ts }) => ({
  type: REMOVE_CHAT_MESSAGE,
  ts,
})

export const FETCH_CHAT_USERS = 'FETCH_CHAT_USERS'
export const FETCH_CHAT_USERS_SUCCESS = 'FETCH_CHAT_USERS_SUCCESS'
export const FETCH_CHAT_USERS_ERROR = 'FETCH_CHAT_USERS_ERROR'

export const loadChatUsers = () => (dispatch, getState) => {
  const userIds = getChatUsersIds(getState())

  if (!userIds.length) {
    return fetchChatUsers()(dispatch, getState)
  }
}

export const fetchChatUsers = () => (dispatch, getState) => {
  dispatch({ type: FETCH_CHAT_USERS })

  const baseUrl = getBaseUrl(getState())

  return fetch(`${baseUrl}/api/chat/users`)
    .then(res => res.json())
    .then(res => {
      if (res.ok) {
        const users = normalize(res.users, Schema.CHAT_USERS)

        return dispatch(fetchChatUsersSuccess(users))
      }

      dispatch(fetchChatUsersError(res.message))
    })
    .catch(err => dispatch(fetchChatUsersError(err.message)))
}

export const fetchChatUsersSuccess = response => ({
  type: FETCH_CHAT_USERS_SUCCESS,
  response,
})

export const fetchChatUsersError = error => ({
  type: FETCH_CHAT_USERS_ERROR,
  error,
})

export const OPEN_CHAT = 'OPEN_CHAT'
export const CLOSE_CHAT = 'CLOSE_CHAT'

export const openChat = () => ({ type: OPEN_CHAT })

export const closeChat = () => ({ type: CLOSE_CHAT })
