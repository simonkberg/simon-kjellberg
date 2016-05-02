import { combineReducers } from 'redux'

import {
  FETCH_CHAT_HISTORY,
  FETCH_CHAT_HISTORY_SUCCESS,
  FETCH_CHAT_HISTORY_ERROR,
  FETCH_CHAT_USERS,
  FETCH_CHAT_USERS_SUCCESS,
  FETCH_CHAT_USERS_ERROR
} from 'actions'

const initialState = {
  entities: {
    messages: {},
    users: {}
  },
  messages: {
    ids: [],
    loading: false,
    error: null
  },
  users: {
    ids: [],
    loading: false,
    error: null
  }
}

function entities (state = initialState.entities, { response }) {
  if (response && response.entities) {
    return {
      ...state,
      ...response.entities
    }
  }

  return state
}

function messages (state = initialState.messages, action) {
  switch (action.type) {
    case FETCH_CHAT_HISTORY:
      return {
        ...state,
        loading: true
      }
    case FETCH_CHAT_HISTORY_SUCCESS:
      return {
        ...state,
        loading: false,
        ids: [...state.ids, action.response.result]
      }
    case FETCH_CHAT_HISTORY_ERROR:
      return {
        ...state,
        loading: false,
        error: action.error
      }
    default:
      return state
  }
}

function users (state = initialState.users, action) {
  switch (action.type) {
    case FETCH_CHAT_USERS:
      return {
        ...state,
        error: null,
        loading: true
      }
    case FETCH_CHAT_USERS_SUCCESS:
      return {
        ...state,
        loading: false,
        ids: [...state.ids, ...action.response.result]
      }
    case FETCH_CHAT_USERS_ERROR:
      return {
        ...state,
        loading: false,
        error: action.error
      }
    default:
      return state
  }
}

export default combineReducers({
  entities,
  messages,
  users
})
