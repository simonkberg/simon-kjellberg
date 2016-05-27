import Immutable from 'immutable'

import { SET_BASE_URL } from './appActions'

const initialState = Immutable.fromJS({ baseUrl: '' })

export default function app (state = initialState, action) {
  switch (action.type) {
    case SET_BASE_URL:
      return state.set('baseUrl', action.baseUrl)
    default:
      return state
  }
}
