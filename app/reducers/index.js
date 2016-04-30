import { combineReducers } from 'redux'
import app from './app'
import stats from './stats'

export default combineReducers({
  app,
  stats
})
