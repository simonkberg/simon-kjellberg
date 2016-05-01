import { combineReducers } from 'redux'
import app from './app'
import stats from './stats'
import chat from './chat'

export default combineReducers({
  app,
  stats,
  chat
})
