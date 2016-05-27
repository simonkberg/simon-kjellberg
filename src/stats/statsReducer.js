import Immutable from 'immutable'

import {
  FETCH_STATS,
  FETCH_STATS_SUCCESS,
  FETCH_STATS_ERROR
} from './statsActions'

const initialState = Immutable.fromJS({
  loading: false,
  data: [],
  error: null
})

export default function stats (state = initialState, action) {
  switch (action.type) {
    case FETCH_STATS:
      return state.set('loading', true)
    case FETCH_STATS_SUCCESS:
      return state.merge({
        loading: false,
        data: action.response['data']
      })
    case FETCH_STATS_ERROR:
      return state.merge({
        loading: false,
        data: action.error
      })
    default:
      return state
  }
}
