import Immutable from 'immutable'

import {
  FETCH_STATS,
  FETCH_STATS_SUCCESS,
  FETCH_STATS_ERROR
} from './statsActions'

const initialState = Immutable.fromJS({
  entities: {},
  ids: [],
  loading: false,
  error: null
})

export default function stats (state = initialState, action) {
  switch (action.type) {
    case FETCH_STATS:
      return state.set({
        loading: true,
        error: null
      })
    case FETCH_STATS_SUCCESS:
      return state.mergeDeep({
        ids: action.response.result,
        entities: action.response.entities.stats,
        loading: false
      })
    case FETCH_STATS_ERROR:
      return state.merge({
        loading: false,
        error: action.error
      })
    default:
      return state
  }
}
