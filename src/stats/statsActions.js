import { normalize } from 'normalizr'
import { Schema } from 'api'

export const FETCH_STATS = 'FETCH_STATS'
export const FETCH_STATS_SUCCESS = 'FETCH_STATS_SUCCESS'
export const FETCH_STATS_ERROR = 'FETCH_STATS_ERROR'

export function loadStats () {
  return function (dispatch, getState) {
    const statsIds = getState().getIn(['stats', 'ids'])

    if (!statsIds.length) {
      return fetchStats()(dispatch, getState)
    }
  }
}

export function fetchStats () {
  return function (dispatch, getState) {
    dispatch({ type: FETCH_STATS })

    const baseUrl = getState().getIn(['app', 'baseUrl'])

    fetch(`${baseUrl}/api/waka-time/stats`)
      .then(res => res.json())
      .then(res => {
        const stats = normalize(res.data, Schema.STATS_ITEMS)

        return dispatch(fetchStatsSuccess(stats))
      })
      .catch(err => dispatch(fetchStatsError(err.message)))
  }
}

export function fetchStatsSuccess (response) {
  return {
    type: FETCH_STATS_SUCCESS,
    response
  }
}

export function fetchStatsError (error) {
  return {
    type: FETCH_STATS_ERROR,
    error
  }
}
