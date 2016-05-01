
export const FETCH_CHAT_HISTORY = 'FETCH_CHAT_HISTORY'
export const FETCH_CHAT_HISTORY_SUCCESS = 'FETCH_CHAT_HISTORY_SUCCESS'
export const FETCH_CHAT_HISTORY_FAILURE = 'FETCH_CHAT_HISTORY_FAILURE'

export function loadChatHistory () {
  return function (dispatch, getState) {
    let { chat } = getState()

    if (!chat.messages.length) {
      return fetchChatHistory()(dispatch, getState)
    }
  }
}

export function fetchChatHistory () {
  return function (dispatch, getState) {
    dispatch({ type: FETCH_CHAT_HISTORY })

    const { app } = getState()

    fetch(`${app.baseUrl}/api/chat/history`)
      .then(response => response.json())
      .then(
        response => dispatch({
          type: FETCH_CHAT_HISTORY_SUCCESS,
          response
        }),
        error => dispatch({
          type: FETCH_CHAT_HISTORY_FAILURE,
          error
        })
      )
  }
}
