import { Map, Set } from 'immutable'
import reducerMap from 'helpers/reducerMap'

import {
  FETCH_STATS,
  FETCH_STATS_SUCCESS,
  FETCH_STATS_ERROR,
} from './statsActions'

const initialState = Map({
  entities: Map(),
  ids: Set(),
  loading: false,
  error: null,
})

const stats = reducerMap(
  {
    [FETCH_STATS]: state => state.merge({
      loading: true,
      error: null,
    }),
    [FETCH_STATS_SUCCESS]: (state, { response }) => state.mergeDeep({
      ids: response.result,
      entities: response.entities.stats,
      loading: false,
    }),
    [FETCH_STATS_ERROR]: (state, { error }) => state.merge({
      loading: false,
      error,
    }),
  },
  initialState
)

export default stats
