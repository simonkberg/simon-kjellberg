import { combineReducers } from 'redux'

import {
  FETCH_CHAT_HISTORY,
  FETCH_CHAT_HISTORY_SUCCESS,
  FETCH_CHAT_HISTORY_ERROR,
  ADD_CHAT_MESSAGE,
  REMOVE_CHAT_MESSAGE,
  FETCH_CHAT_USERS,
  FETCH_CHAT_USERS_SUCCESS,
  FETCH_CHAT_USERS_ERROR,
  OPEN_CHAT,
  CLOSE_CHAT
} from './chatActions'

const initialState = {
  open: __DEV__,
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

function open (state = initialState.open, action) {
  switch (action.type) {
    case OPEN_CHAT:
      return true
    case CLOSE_CHAT:
      return false
    default:
      return state
  }
}

function entities (state = initialState.entities, action) {
  const nextState = {...state}

  if (action.response && action.response.entities) {
    const { response } = action

    if (response.entities.messages) {
      nextState.messages = {
        ...nextState.messages,
        ...response.entities.messages
      }
    }

    if (response.entities.users) {
      nextState.users = {
        ...nextState.users,
        ...response.entities.users
      }
    }

    return nextState
  }

  switch (action.type) {
    case REMOVE_CHAT_MESSAGE:
      nextState.messages = {...nextState.messages}

      delete nextState.messages[action.ts]

      return nextState
    default:
      return state
  }
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
        ids: [...state.ids, ...action.response.result]
      }
    case FETCH_CHAT_HISTORY_ERROR:
      return {
        ...state,
        loading: false,
        error: action.error
      }
    case ADD_CHAT_MESSAGE:
      return {
        ...state,
        ids: [...state.ids, action.response.result]
      }
    case REMOVE_CHAT_MESSAGE:
      return {
        ...state,
        ids: state.ids.filter(ts => ts !== action.ts)
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
  open,
  entities,
  messages,
  users
})
