import { SET_BASE_URL } from './appActions'

const initialState = {
  baseUrl: ''
}

export default function app (state = initialState, action) {
  switch (action.type) {
    case SET_BASE_URL:
      return {
        ...state,
        baseUrl: action.baseUrl
      }
    default:
      return state
  }
}
