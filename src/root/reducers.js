import { combineReducers } from 'redux-immutable'
import app from 'app/appReducer'
import stats from 'stats/statsReducer'
import chat from 'chat/chatReducer'

export default combineReducers({
  app,
  stats,
  chat
})
