
import { normalize } from 'normalizr'
import { Schema } from 'api'
import { getBaseUrl } from 'app/appSelectors'
import { getChatMessageIds, getChatUsersIds } from './chatSelectors'

export const FETCH_CHAT_HISTORY = 'FETCH_CHAT_HISTORY'
export const FETCH_CHAT_HISTORY_SUCCESS = 'FETCH_CHAT_HISTORY_SUCCESS'
export const FETCH_CHAT_HISTORY_ERROR = 'FETCH_CHAT_HISTORY_ERROR'

export function loadChatHistory () {
  return function (dispatch, getState) {
    const messageIds = getChatMessageIds(getState())

    if (!messageIds.length) {
      return fetchChatHistory()(dispatch, getState)
    }
  }
}

export function fetchChatHistory () {
  return function (dispatch, getState) {
    dispatch({ type: FETCH_CHAT_HISTORY })

    const baseUrl = getBaseUrl(getState())

    fetch(`${baseUrl}/api/chat/history`)
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
}

export function fetchChatHistorySuccess (response) {
  return {
    type: FETCH_CHAT_HISTORY_SUCCESS,
    response
  }
}

export function fetchChatHistoryError (error) {
  return {
    type: FETCH_CHAT_HISTORY_ERROR,
    error
  }
}

export const ADD_CHAT_MESSAGE = 'ADD_CHAT_MESSAGE'
export const REMOVE_CHAT_MESSAGE = 'REMOVE_CHAT_MESSAGE'

export function addChatMessage (message) {
  return {
    type: ADD_CHAT_MESSAGE,
    response: normalize(message, Schema.CHAT_MESSAGE)
  }
}

export function removeChatMessage ({ ts }) {
  return {
    type: REMOVE_CHAT_MESSAGE,
    ts
  }
}

export const FETCH_CHAT_USERS = 'FETCH_CHAT_USERS'
export const FETCH_CHAT_USERS_SUCCESS = 'FETCH_CHAT_USERS_SUCCESS'
export const FETCH_CHAT_USERS_ERROR = 'FETCH_CHAT_USERS_ERROR'

export function loadChatUsers () {
  return function (dispatch, getState) {
    const userIds = getChatUsersIds(getState())

    if (!userIds.length) {
      return fetchChatUsers()(dispatch, getState)
    }
  }
}

export function fetchChatUsers () {
  return function (dispatch, getState) {
    dispatch({ type: FETCH_CHAT_USERS })

    const baseUrl = getBaseUrl(getState())

    fetch(`${baseUrl}/api/chat/users`)
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
}

export function fetchChatUsersSuccess (response) {
  return {
    type: FETCH_CHAT_USERS_SUCCESS,
    response
  }
}

export function fetchChatUsersError (error) {
  return {
    type: FETCH_CHAT_USERS_ERROR,
    error
  }
}

export const OPEN_CHAT = 'OPEN_CHAT'
export const CLOSE_CHAT = 'CLOSE_CHAT'

export function openChat () {
  return { type: OPEN_CHAT }
}

export function closeChat () {
  return { type: CLOSE_CHAT }
}
