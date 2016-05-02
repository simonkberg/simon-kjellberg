
export const FETCH_STATS = 'FETCH_STATS'
export const FETCH_STATS_SUCCESS = 'FETCH_STATS_SUCCESS'
export const FETCH_STATS_ERROR = 'FETCH_STATS_ERROR'

export function loadStats () {
  return function (dispatch, getState) {
    let { stats } = getState()

    if (!stats.data.length) {
      return fetchStats()(dispatch, getState)
    }
  }
}

export function fetchStats () {
  return function (dispatch, getState) {
    dispatch({ type: FETCH_STATS })

    const { app } = getState()

    fetch(`${app.baseUrl}/api/waka-time/stats`)
      .then(response => response.json())
      .then(
        response => dispatch({
          type: FETCH_STATS_SUCCESS,
          response
        }),
        error => dispatch({
          type: FETCH_STATS_ERROR,
          error
        })
      )
  }
}
