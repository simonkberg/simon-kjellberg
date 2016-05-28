import Immutable from 'immutable'
import { combineReducers } from 'redux-immutable'

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

const initialState = Immutable.fromJS({
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
})

function open (state = initialState.get('open'), action) {
  switch (action.type) {
    case OPEN_CHAT:
      return true
    case CLOSE_CHAT:
      return false
    default:
      return state
  }
}

function entities (state = initialState.get('entities'), action) {
  switch (action.type) {
    case FETCH_CHAT_HISTORY_SUCCESS:
    case FETCH_CHAT_USERS_SUCCESS:
    case ADD_CHAT_MESSAGE:
      return state.mergeDeep(action.response.entities)
    case REMOVE_CHAT_MESSAGE:
      return state.deleteIn(['messages', action.ts])
    default:
      return state
  }
}

function messages (state = initialState.get('messages'), action) {
  switch (action.type) {
    case FETCH_CHAT_HISTORY:
      return state.merge({
        loading: true,
        error: null
      })
    case FETCH_CHAT_HISTORY_SUCCESS:
      return state.mergeDeep({
        ids: action.response.result,
        loading: false
      })
    case FETCH_CHAT_HISTORY_ERROR:
      return state.merge({
        loading: false,
        error: action.error
      })
    case ADD_CHAT_MESSAGE:
      return state.update('ids', ids => ids.push(action.response.result))
    case REMOVE_CHAT_MESSAGE:
      return state.update('ids', ids => ids.filter(ts => ts !== action.ts))
    default:
      return state
  }
}

function users (state = initialState.get('users'), action) {
  switch (action.type) {
    case FETCH_CHAT_USERS:
      return state.merge({
        loading: true,
        error: null
      })
    case FETCH_CHAT_USERS_SUCCESS:
      return state.mergeDeep({
        ids: action.response.result,
        loading: false
      })
    case FETCH_CHAT_USERS_ERROR:
      return state.merge({
        loading: false,
        error: action.error
      })
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
