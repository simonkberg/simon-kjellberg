import {
  FETCH_CHAT_HISTORY,
  FETCH_CHAT_HISTORY_SUCCESS,
  FETCH_CHAT_HISTORY_FAILURE
} from 'actions'

const initialState = {
  loading: false,
  messages: [],
  users: [],
  error: null
}

export default function stats (state = initialState, action) {
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
        messages: action.response.messages
      }
    case FETCH_CHAT_HISTORY_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.error
      }
    default:
      return state
  }
}
