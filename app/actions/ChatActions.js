
import { normalize } from 'normalizr'
import { Schema } from 'api'

export const FETCH_CHAT_HISTORY = 'FETCH_CHAT_HISTORY'
export const FETCH_CHAT_HISTORY_SUCCESS = 'FETCH_CHAT_HISTORY_SUCCESS'
export const FETCH_CHAT_HISTORY_ERROR = 'FETCH_CHAT_HISTORY_ERROR'

export function loadChatHistory () {
  return function (dispatch, getState) {
    let { chat } = getState()

    if (!chat.messages.length) {
      return fetchChatHistory()(dispatch, getState)
    }
  }
}

export function fetchChatHistory () {
  return function (dispatch, getState) {
    dispatch({ type: FETCH_CHAT_HISTORY })

    const { app } = getState()

    fetch(`${app.baseUrl}/api/chat/history`)
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

export const FETCH_CHAT_USERS = 'FETCH_CHAT_USERS'
export const FETCH_CHAT_USERS_SUCCESS = 'FETCH_CHAT_USERS_SUCCESS'
export const FETCH_CHAT_USERS_ERROR = 'FETCH_CHAT_USERS_ERROR'

export function loadChatUsers () {
  return function (dispatch, getState) {
    const { chat } = getState()

    if (!chat.users.ids.length) {
      return fetchChatUsers()(dispatch, getState)
    }
  }
}

export function fetchChatUsers () {
  return function (dispatch, getState) {
    dispatch({ type: FETCH_CHAT_USERS })

    const { app } = getState()

    fetch(`${app.baseUrl}/api/chat/users`)
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
