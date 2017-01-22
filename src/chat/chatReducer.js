import { Map, Set } from 'immutable'
import { combineReducers } from 'redux-immutable'

import reducerMap from 'helpers/reducerMap'

import {
  FETCH_CHAT_HISTORY,
  FETCH_CHAT_HISTORY_SUCCESS,
  FETCH_CHAT_HISTORY_ERROR,
  ADD_CHAT_MESSAGE,
  UPDATE_CHAT_MESSAGE,
  REMOVE_CHAT_MESSAGE,
  FETCH_CHAT_USERS,
  FETCH_CHAT_USERS_SUCCESS,
  FETCH_CHAT_USERS_ERROR,
} from './chatActions'

const initialState = {
  entities: Map({
    messages: Map(),
    users: Map(),
  }),
  messages: Map({
    ids: Set(),
    loading: false,
    error: null,
  }),
  users: Map({
    ids: Set(),
    loading: false,
    error: null,
  }),
}

const mergeEntities = (state, action) =>
  state.mergeDeep(action.response.entities)

const entities = reducerMap({
  [FETCH_CHAT_HISTORY_SUCCESS]: mergeEntities,
  [FETCH_CHAT_USERS_SUCCESS]: mergeEntities,
  [ADD_CHAT_MESSAGE]: mergeEntities,
  [UPDATE_CHAT_MESSAGE]: mergeEntities,
}, initialState.entities)

const messages = reducerMap({
  [FETCH_CHAT_HISTORY]: state => state.merge({
    loading: true,
    error: null,
  }),
  [FETCH_CHAT_HISTORY_SUCCESS]: (state, action) => state.mergeDeep({
    ids: action.response.result,
    loading: false,
  }),
  [FETCH_CHAT_HISTORY_ERROR]: (state, { error }) => state.merge({
    loading: false,
    error,
  }),
  [ADD_CHAT_MESSAGE]: (state, action) => state.update(
    'ids', ids => ids.push(action.response.result)
  ),
  [REMOVE_CHAT_MESSAGE]: (state, action) => state.update(
    'ids', ids => ids.filter(ts => ts !== action.ts)
  ),
}, initialState.messages)

const users = reducerMap({
  [FETCH_CHAT_USERS]: state => state.merge({
    loading: true,
    error: null,
  }),
  [FETCH_CHAT_USERS_SUCCESS]: (state, action) => state.mergeDeep({
    ids: action.response.result,
    loading: false,
  }),
  [FETCH_CHAT_USERS_ERROR]: (state, { error }) => state.merge({
    loading: false,
    error,
  }),
}, initialState.users)

export default combineReducers({
  entities,
  messages,
  users,
})
